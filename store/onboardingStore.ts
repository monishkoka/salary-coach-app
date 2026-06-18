import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Debt,
  Expense,
  Goal,
  Investment,
  RiskProfile,
} from '@/types';

/**
 * Holds the data collected across the 10-step onboarding flow before it is
 * committed to the profile store / backend on the final step.
 */
interface OnboardingState {
  name: string;
  age: number | null;
  monthlyIncomePaise: number;
  expectedGrowthPct: number;
  expenses: Expense[];
  savingsPaise: number;
  emergencyFundPaise: number;
  investments: Investment[];
  debts: Debt[];
  goals: Goal[];
  riskScore: number;
  riskProfile: RiskProfile;

  set: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  setExpense: (category: Expense['category'], amountPaise: number, essential?: boolean) => void;
  toggleGoal: (goal: Goal) => void;
  computeRisk: (totalScore: number) => void;
  reset: () => void;
}

const initialExpenses: Expense[] = [];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
  name: '',
  age: null,
  monthlyIncomePaise: 0,
  expectedGrowthPct: 10,
  expenses: initialExpenses,
  savingsPaise: 0,
  emergencyFundPaise: 0,
  investments: [],
  debts: [],
  goals: [],
  riskScore: 0,
  riskProfile: 'balanced',

  set: (key, value) => set({ [key]: value } as Pick<OnboardingState, typeof key>),

  setExpense: (category, amountPaise, essential = true) => {
    const others = get().expenses.filter((e) => e.category !== category);
    if (amountPaise <= 0) {
      set({ expenses: others });
      return;
    }
    set({
      expenses: [
        ...others,
        {
          id: `exp-${category}`,
          userId: 'local',
          category,
          label: category,
          amountPaise,
          isEssential: essential,
          isRecurring: true,
          period: 'monthly',
        },
      ],
    });
  },

  toggleGoal: (goal) => {
    const exists = get().goals.some((g) => g.id === goal.id);
    set({
      goals: exists
        ? get().goals.filter((g) => g.id !== goal.id)
        : [...get().goals, goal],
    });
  },

  computeRisk: (totalScore) => {
    // 0–9 conservative, 10–18 balanced, 19+ aggressive (3 questions, max ~9).
    const profile: RiskProfile =
      totalScore <= 3 ? 'conservative' : totalScore <= 6 ? 'balanced' : 'aggressive';
    set({ riskScore: totalScore, riskProfile: profile });
  },

  reset: () =>
    set({
      name: '',
      age: null,
      monthlyIncomePaise: 0,
      expectedGrowthPct: 10,
      expenses: [],
      savingsPaise: 0,
      emergencyFundPaise: 0,
      investments: [],
      debts: [],
      goals: [],
      riskScore: 0,
      riskProfile: 'balanced',
    }),
    }),
    { name: 'sc:onboarding-draft', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
