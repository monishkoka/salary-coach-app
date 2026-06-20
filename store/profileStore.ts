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
  /** Force a re-fetch of the signed-in user's data from the backend (pull-to-refresh). */
  refresh: () => Promise<void>;
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
        const authUserId = useAuthStore.getState().userId;
        // Defensive per-user isolation: if persisted data belongs to a different
        // account than the one signed in (e.g. incomplete teardown on a shared
        // device), discard it before doing anything else. Never show one user
        // another user's finances.
        const persisted = get().user;
        if (!config.useMockData && persisted && authUserId && persisted.id !== authUserId) {
          set({ ...EMPTY_PROFILE });
        }
        // If we already have persisted data for THIS user, keep it — never
        // clobber real data.
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

  refresh: async () => {
    // Mock mode has no backend to pull from — just recompute from local state.
    if (config.useMockData) {
      get().recomputeScores();
      return;
    }
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
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
      // Keep current state on a transient network error.
    }
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

    // Build a clean profile from the user's own onboarding answers. We never
    // spread the demo persona here — that previously leaked fields like
    // "priya@example.com" into real production accounts.
    const user: UserProfile = {
      id: userId,
      email: payload.user.email ?? null,
      displayName: payload.user.displayName ?? '',
      age: payload.user.age ?? null,
      maritalStatus: payload.user.maritalStatus ?? null,
      dependents: payload.user.dependents ?? {},
      riskProfile: payload.riskProfile,
      salaryDnaArchetype: payload.user.salaryDnaArchetype ?? null,
      taxRegime: payload.user.taxRegime ?? 'new',
      payDayOfMonth: payload.user.payDayOfMonth ?? null,
      city: payload.user.city ?? null,
      subscriptionTier: payload.user.subscriptionTier ?? 'free',
      onboardingCompletedAt: new Date().toISOString(),
      currency: payload.user.currency ?? 'INR',
    };
    const expenses = payload.expenses.map((e) => ({ ...e, userId }));
    const investments = payload.investments.map((i) => ({ ...i, userId }));
    const debts = payload.debts.map((d) => ({ ...d, userId }));
    const goals = payload.goals.map((g) => ({ ...g, userId }));

    set({
      loaded: true,
      user,
      financials,
      expenses,
      investments,
      debts,
      goals,
    });
    get().recomputeScores();

    // Persist the freshly onboarded picture (no-ops in mock mode). Line-item
    // data (expenses/investments/debts) is synced too so a reinstall or new
    // device restores the full picture, not just the aggregates.
    void enqueueSync({ entity: 'profile', type: 'upsert', userId, payload: user });
    void enqueueSync({ entity: 'financials', type: 'upsert', userId, payload: financials });
    expenses.forEach((e) => void enqueueSync({ entity: 'expense', type: 'upsert', userId, payload: e }));
    investments.forEach((i) => void enqueueSync({ entity: 'investment', type: 'upsert', userId, payload: i }));
    debts.forEach((d) => void enqueueSync({ entity: 'debt', type: 'upsert', userId, payload: d }));
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
