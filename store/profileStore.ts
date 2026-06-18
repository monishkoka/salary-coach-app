import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AIContext,
  Debt,
  Expense,
  FinancialProfile,
  FinancialScores,
  Goal,
  Investment,
  RiskProfile,
  UserProfile,
} from '@/types';
import { computeScores } from '@/services/engine';
import { config } from '@/constants/config';
import { fetchFullProfile } from '@/services/supabase/repositories';
import { enqueueSync } from '@/services/sync/queue';
import { useAuthStore } from './authStore';
import {
  mockDebts,
  mockExpenses,
  mockFinancialProfile,
  mockGoals,
  mockInvestments,
  mockUser,
} from '@/utils/mockData';

interface ProfileState {
  loaded: boolean;
  user: UserProfile | null;
  financials: FinancialProfile | null;
  expenses: Expense[];
  investments: Investment[];
  debts: Debt[];
  goals: Goal[];
  scores: FinancialScores | null;

  load: () => Promise<void>;
  recomputeScores: () => void;
  getContext: () => AIContext | null;

  // Goal CRUD (optimistic; persistence wired in repository layer for prod).
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Used by onboarding to commit collected data.
  hydrateFromOnboarding: (payload: OnboardingCommit) => void;

  /** Clear all financial data (called on sign-out so nothing leaks across users). */
  reset: () => void;
}

export interface OnboardingCommit {
  user: Partial<UserProfile>;
  financials: Partial<FinancialProfile>;
  expenses: Expense[];
  investments: Investment[];
  debts: Debt[];
  goals: Goal[];
  riskProfile: RiskProfile;
}

const EMPTY_PROFILE = {
  user: null as UserProfile | null,
  financials: null as FinancialProfile | null,
  expenses: [] as Expense[],
  investments: [] as Investment[],
  debts: [] as Debt[],
  goals: [] as Goal[],
  scores: null as FinancialScores | null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      loaded: false,
      ...EMPTY_PROFILE,

      load: async () => {
        // If we already have persisted data (user completed onboarding on a
        // previous launch, or signed in), keep it — never clobber real data.
        if (get().user && get().financials) {
          get().recomputeScores();
          set({ loaded: true });
          return;
        }
        // First run in demo/mock mode: seed the showcase persona so the product
        // is explorable immediately. Real onboarding overwrites this and persists.
        if (config.useMockData) {
          set({
            user: mockUser,
            financials: mockFinancialProfile,
            expenses: mockExpenses,
            investments: mockInvestments,
            debts: mockDebts,
            goals: mockGoals,
          });
          get().recomputeScores();
          set({ loaded: true });
          return;
        }
        // Production: hydrate the full financial picture from Supabase for the
        // signed-in user. Falls back gracefully (stays empty → onboarding) on
        // any error so a transient network blip never blocks the app.
        const userId = useAuthStore.getState().userId;
        if (userId) {
          try {
            const snap = await fetchFullProfile(userId);
            if (snap) {
              set({
                user: snap.user,
                financials: snap.financials,
                goals: snap.goals,
                expenses: snap.expenses,
                investments: snap.investments,
                debts: snap.debts,
              });
              get().recomputeScores();
            }
          } catch {
            // Offline / cold cache: leave state empty; UI shows onboarding/empty.
          }
        }
        set({ loaded: true });
      },

  recomputeScores: () => {
    const ctx = buildContext(get());
    if (!ctx) return;
    const scores = computeScores(ctx);
    set({ scores: { id: 'local', userId: ctx.profile.id, ...scores } });
  },

  getContext: () => {
    const state = get();
    const ctx = buildContext(state);
    if (!ctx) return null;
    return { ...ctx, scores: state.scores };
  },

  addGoal: (goal) => {
    // Optimistic local write, then durable background sync (no-op in mock mode).
    set({ goals: [...get().goals, goal] });
    get().recomputeScores();
    void enqueueSync({ entity: 'goal', type: 'upsert', userId: goal.userId, payload: goal });
  },
  updateGoal: (id, patch) => {
    const next = get().goals.map((g) => (g.id === id ? { ...g, ...patch } : g));
    set({ goals: next });
    get().recomputeScores();
    const updated = next.find((g) => g.id === id);
    if (updated) {
      void enqueueSync({ entity: 'goal', type: 'upsert', userId: updated.userId, payload: updated });
    }
  },
  removeGoal: (id) => {
    const target = get().goals.find((g) => g.id === id);
    set({ goals: get().goals.filter((g) => g.id !== id) });
    get().recomputeScores();
    if (target) {
      void enqueueSync({ entity: 'goal', type: 'delete', userId: target.userId, payload: id });
    }
  },

  hydrateFromOnboarding: (payload) => {
    const expensesTotal = payload.expenses.reduce((s, e) => s + e.amountPaise, 0);
    const income = payload.financials.monthlyIncomePaise ?? 0;
    const investTotal = payload.investments.reduce((s, i) => s + i.currentValuePaise, 0);
    const debtTotal = payload.debts.reduce((s, d) => s + d.principalOutstandingPaise, 0);
    const savings = payload.financials.totalSavingsPaise ?? 0;
    // Use the real signed-in user id in production; fall back to the demo id.
    const userId = useAuthStore.getState().userId ?? mockUser.id;

    const financials: FinancialProfile = {
      id: 'fp-local',
      userId,
      monthlyIncomePaise: income,
      expectedGrowthPct: payload.financials.expectedGrowthPct ?? 10,
      totalExpensesPaise: expensesTotal,
      totalSavingsPaise: savings,
      totalInvestmentsPaise: investTotal,
      totalDebtPaise: debtTotal,
      emergencyMonthsTarget: payload.financials.emergencyMonthsTarget ?? 6,
      emergencyFundPaise: payload.financials.emergencyFundPaise ?? savings,
      monthlySurplusPaise: income - expensesTotal,
      netWorthPaise: savings + investTotal - debtTotal,
      assumptions: {
        expectedReturnEquityPct: 12,
        expectedReturnDebtPct: 7,
        inflationPct: 6,
        salaryGrowthPct: payload.financials.expectedGrowthPct ?? 10,
        retirementAge: 55,
      },
    };

    const user: UserProfile = {
      ...mockUser,
      ...payload.user,
      id: userId,
      riskProfile: payload.riskProfile,
    };
    const goals = payload.goals.map((g) => ({ ...g, userId }));

    set({
      loaded: true,
      user,
      financials,
      expenses: payload.expenses,
      investments: payload.investments,
      debts: payload.debts,
      goals,
    });
    get().recomputeScores();

    // Persist the freshly onboarded picture (no-ops in mock mode).
    void enqueueSync({ entity: 'profile', type: 'upsert', userId, payload: user });
    void enqueueSync({ entity: 'financials', type: 'upsert', userId, payload: financials });
    goals.forEach((g) => void enqueueSync({ entity: 'goal', type: 'upsert', userId, payload: g }));
  },

  reset: () => set({ loaded: false, ...EMPTY_PROFILE }),
    }),
    {
      name: 'sc:profile',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data, never the transient `loaded` flag.
      partialize: (state) => ({
        user: state.user,
        financials: state.financials,
        expenses: state.expenses,
        investments: state.investments,
        debts: state.debts,
        goals: state.goals,
        scores: state.scores,
      }),
    },
  ),
);

function buildContext(state: ProfileState): AIContext | null {
  if (!state.user || !state.financials) return null;
  return {
    profile: state.user,
    financials: state.financials,
    goals: state.goals,
    expenses: state.expenses,
    debts: state.debts,
    investments: state.investments,
    scores: state.scores,
  };
}
