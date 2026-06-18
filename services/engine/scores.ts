/**
 * Scoring engine (deterministic, fully transparent).
 *
 * Financial Health Score (0–100): how strong is the user's financial position
 *   right now? Weighted blend of savings rate, debt ratio, emergency fund,
 *   goal progress and diversification.
 *
 * Wealth Velocity Score (0–100): how FAST are they moving toward financial
 *   independence? Rewards momentum (consistency, investment rate, net-worth
 *   growth) so even a modest earner who is improving scores well.
 */

import type {
  AIContext,
  FinancialScores,
  HealthSubScores,
  VelocityFactors,
} from '@/types';
import { clamp } from '@/utils/finance';
import { addMonthsISO } from '@/utils/date';

const HEALTH_WEIGHTS = {
  savingsRate: 0.3,
  debtRatio: 0.2,
  emergencyFund: 0.25,
  goalProgress: 0.15,
  diversification: 0.1,
} as const;

const VELOCITY_WEIGHTS = {
  goalProgress: 0.25,
  savingsConsistency: 0.25,
  investmentRate: 0.3,
  netWorthGrowth: 0.2,
} as const;

export function computeScores(
  context: AIContext,
  history?: { savingsConsistencyPct?: number; netWorthGrowthPct?: number },
): Omit<FinancialScores, 'id' | 'userId'> {
  const sub = healthSubScores(context);
  const healthScore = Math.round(
    sub.savingsRate * HEALTH_WEIGHTS.savingsRate +
      sub.debtRatio * HEALTH_WEIGHTS.debtRatio +
      sub.emergencyFund * HEALTH_WEIGHTS.emergencyFund +
      sub.goalProgress * HEALTH_WEIGHTS.goalProgress +
      sub.diversification * HEALTH_WEIGHTS.diversification,
  );

  const factors = velocityFactors(context, history);
  const velocityScore = Math.round(
    factors.goalProgress * VELOCITY_WEIGHTS.goalProgress +
      factors.savingsConsistency * VELOCITY_WEIGHTS.savingsConsistency +
      factors.investmentRate * VELOCITY_WEIGHTS.investmentRate +
      factors.netWorthGrowth * VELOCITY_WEIGHTS.netWorthGrowth,
  );

  return {
    healthScore: clamp(healthScore, 0, 100),
    healthSubScores: sub,
    velocityScore: clamp(velocityScore, 0, 100),
    velocityFactors: factors,
    projectedFiDate: projectFiDate(context),
    computedAt: new Date().toISOString(),
  };
}

function healthSubScores(context: AIContext): HealthSubScores {
  const { financials, goals } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);
  const monthlyEssential = Math.max(1, financials.totalExpensesPaise);

  // Savings rate: surplus / income. 30%+ is excellent.
  const savingsRatePct = (financials.monthlySurplusPaise / income) * 100;
  const savingsRate = clamp((savingsRatePct / 30) * 100, 0, 100);

  // Debt ratio: monthly debt payments vs income. Below 20% is healthy.
  const debtPayments = context.debts.reduce((s, d) => s + d.emiPaise, 0);
  const debtRatioPct = (debtPayments / income) * 100;
  const debtRatio = clamp(100 - (debtRatioPct / 40) * 100, 0, 100);

  // Emergency fund: months covered vs target.
  const monthsCovered = financials.emergencyFundPaise / monthlyEssential;
  const emergencyFund = clamp((monthsCovered / financials.emergencyMonthsTarget) * 100, 0, 100);

  // Goal progress: average % funded across active goals.
  const active = goals.filter((g) => g.status !== 'achieved');
  const goalProgress = active.length
    ? clamp(
        active.reduce(
          (s, g) => s + (g.currentAmountPaise / Math.max(1, g.targetAmountPaise)) * 100,
          0,
        ) / active.length,
        0,
        100,
      )
    : 60; // neutral default when no goals yet

  // Diversification: distinct investment asset classes (cap at 5 → 100).
  const distinctClasses = new Set(context.investments.map((i) => i.assetClass)).size;
  const diversification = clamp((distinctClasses / 5) * 100, 0, 100);

  // Lifestyle Control: how contained discretionary (non-essential) spend is.
  // 0% of income on discretionary → 100; 25%+ → 0.
  const discretionary = context.expenses
    .filter((e) => !e.isEssential)
    .reduce((s, e) => s + e.amountPaise, 0);
  const discretionaryPct = (discretionary / income) * 100;
  const lifestyleControl = clamp(100 - (discretionaryPct / 25) * 100, 0, 100);

  // Investment Discipline: recurring SIP rate. 20%+ of income → 100.
  const monthlySip = context.investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  const sipRatePct = (monthlySip / income) * 100;
  const investmentDiscipline = clamp((sipRatePct / 20) * 100, 0, 100);

  return {
    savingsRate: Math.round(savingsRate),
    debtRatio: Math.round(debtRatio),
    emergencyFund: Math.round(emergencyFund),
    goalProgress: Math.round(goalProgress),
    diversification: Math.round(diversification),
    lifestyleControl: Math.round(lifestyleControl),
    investmentDiscipline: Math.round(investmentDiscipline),
  };
}

function velocityFactors(
  context: AIContext,
  history?: { savingsConsistencyPct?: number; netWorthGrowthPct?: number },
): VelocityFactors {
  const { financials, goals, investments } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);

  const active = goals.filter((g) => g.status !== 'achieved');
  const goalProgress = active.length
    ? clamp(
        active.reduce(
          (s, g) => s + (g.currentAmountPaise / Math.max(1, g.targetAmountPaise)) * 100,
          0,
        ) / active.length,
        0,
        100,
      )
    : 50;

  const savingsConsistency = clamp(history?.savingsConsistencyPct ?? 70, 0, 100);

  const monthlySip = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  const investmentRatePct = (monthlySip / income) * 100;
  const investmentRate = clamp((investmentRatePct / 25) * 100, 0, 100);

  const netWorthGrowth = clamp(((history?.netWorthGrowthPct ?? 8) / 15) * 100, 0, 100);

  return {
    goalProgress: Math.round(goalProgress),
    savingsConsistency: Math.round(savingsConsistency),
    investmentRate: Math.round(investmentRate),
    netWorthGrowth: Math.round(netWorthGrowth),
  };
}

/** Rough financial-independence estimate: corpus = 25x annual expenses (4% rule). */
function projectFiDate(context: AIContext): string | null {
  const { financials } = context;
  const annualExpense = financials.totalExpensesPaise * 12;
  const targetCorpus = annualExpense * 25;
  if (targetCorpus <= 0) return null;

  const monthlyContribution =
    financials.monthlySurplusPaise +
    context.investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  if (monthlyContribution <= 0) return null;

  const r = (context.profile.riskProfile === 'aggressive' ? 12 : 10) / 100 / 12;
  let corpus = financials.netWorthPaise;
  for (let m = 1; m <= 600; m += 1) {
    corpus = corpus * (1 + r) + monthlyContribution;
    if (corpus >= targetCorpus) return addMonthsISO(m);
  }
  return null;
}

/**
 * Human explanations for the Financial Health Engine's five named sub-scores
 * (Emergency Readiness, Investment Discipline, Goal Achievement, Lifestyle
 * Control, Debt Management) — used by the breakdown sheet and improvement plan.
 */
export function explainHealth(sub: HealthSubScores): { label: string; score: number; note: string }[] {
  return [
    {
      label: 'Emergency Readiness',
      score: sub.emergencyFund,
      note: 'Months of expenses you can cover without income. Target your full buffer.',
    },
    {
      label: 'Investment Discipline',
      score: sub.investmentDiscipline,
      note: 'How consistently you invest each month. Automate SIPs toward 20% of income.',
    },
    {
      label: 'Goal Achievement',
      score: sub.goalProgress,
      note: 'How far along your active goals are on average.',
    },
    {
      label: 'Lifestyle Control',
      score: sub.lifestyleControl,
      note: 'How contained your discretionary spend is — guards against lifestyle inflation.',
    },
    {
      label: 'Debt Management',
      score: sub.debtRatio,
      note: 'Lower EMIs relative to income score higher. Keep below 40%.',
    },
  ];
}

/**
 * Strengths & weaknesses + a personalized improvement plan, derived from the
 * named sub-scores. Powers the Financial Health Engine's coaching surface.
 */
export function healthImprovementPlan(sub: HealthSubScores): {
  strengths: string[];
  weaknesses: string[];
  plan: string[];
} {
  const rows = explainHealth(sub);
  const strengths = rows.filter((r) => r.score >= 70).map((r) => r.label);
  const weaknesses = rows.filter((r) => r.score < 50).map((r) => r.label);

  const plan: string[] = [];
  if (sub.emergencyFund < 50) plan.push('Top up your emergency fund before increasing risk elsewhere.');
  if (sub.debtRatio < 50) plan.push('Prioritize paying down high-interest debt to free up monthly cash flow.');
  if (sub.investmentDiscipline < 50) plan.push('Set up an automatic SIP so investing happens on payday, not by willpower.');
  if (sub.lifestyleControl < 50) plan.push('Cap discretionary spend and route the difference to your goals.');
  if (sub.goalProgress < 50) plan.push('Fund your top-priority goal first; pause lower-priority ones if needed.');
  if (plan.length === 0) plan.push('Your fundamentals are strong — step up contributions ~10% at your next raise.');

  return { strengths, weaknesses, plan };
}
