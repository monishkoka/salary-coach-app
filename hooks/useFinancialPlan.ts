import { useMemo } from 'react';
import type { ActionPlan, Insight, MoneyGps, ScenarioProjection } from '@/types';
import {
  buildActionPlan,
  buildMoneyGps,
  generateInsights,
  simulateScenarios,
} from '@/services/engine';
import { useProfileStore } from '@/store/profileStore';

export interface FinancialPlan {
  actionPlan: ActionPlan;
  moneyGps: MoneyGps;
  scenarios: ScenarioProjection[];
  insights: Insight[];
}

/**
 * Derives all forward-looking engine outputs (action plan, Money GPS, Future
 * Self scenarios, insights) from the current profile context, memoized on the
 * inputs that actually affect the math. Returns null until the profile loads.
 */
export function useFinancialPlan(): FinancialPlan | null {
  const financials = useProfileStore((s) => s.financials);
  const goals = useProfileStore((s) => s.goals);
  const investments = useProfileStore((s) => s.investments);
  const debts = useProfileStore((s) => s.debts);
  const expenses = useProfileStore((s) => s.expenses);
  const scores = useProfileStore((s) => s.scores);
  const getContext = useProfileStore((s) => s.getContext);

  return useMemo(() => {
    const ctx = getContext();
    if (!ctx) return null;
    return {
      actionPlan: buildActionPlan(ctx),
      moneyGps: buildMoneyGps(ctx),
      scenarios: simulateScenarios(ctx),
      insights: generateInsights(ctx),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financials, goals, investments, debts, expenses, scores, getContext]);
}
