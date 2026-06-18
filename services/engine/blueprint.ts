/**
 * Salary Blueprint generator (deterministic).
 *
 * This is the heart of the product: given the user's finances, produce an
 * ordered, explainable allocation of the *next* paycheck. The AI layer only
 * narrates these numbers — it never invents them.
 *
 * Rule hierarchy (waterfall over surplus after essential needs):
 *   1. Cover essential needs (rent, EMIs, food, transport, utilities, family).
 *   2. Pay down expensive debt (credit cards / personal loans > ~14%).
 *   3. Build the emergency fund to target months of essential spend.
 *   4. Tax-advantaged + long-term investments (EPF/ELSS/NPS, SIPs) per risk.
 *   5. Fund prioritized goals.
 *   6. Lifestyle (capped to prevent lifestyle inflation).
 */

import type {
  AIContext,
  AllocationLine,
  Debt,
  Goal,
  SalaryBlueprint,
} from '@/types';
import { clamp } from '@/utils/finance';
import {
  DEBT_PAYDOWN_SURPLUS_SHARE,
  EMERGENCY_CLOSE_MONTHS,
  EMERGENCY_MAX_SURPLUS_SHARE,
  GOAL_BUDGET_SURPLUS_SHARE,
  HIGH_INTEREST_PCT,
  riskMix,
} from './constants';

const HIGH_INTEREST_THRESHOLD = HIGH_INTEREST_PCT;

export interface BlueprintResult {
  allocations: AllocationLine[];
  summary: string;
}

export function generateBlueprint(
  context: AIContext,
  periodStart: string,
): Omit<SalaryBlueprint, 'id' | 'userId'> {
  const { financials, profile, goals, debts } = context;
  const income = financials.monthlyIncomePaise;
  const essentialNeeds = financials.totalExpensesPaise;
  const mix = riskMix(profile.riskProfile);

  const allocations: AllocationLine[] = [];
  let remaining = income;

  // 1) Needs ------------------------------------------------------------------
  const needs = Math.min(essentialNeeds, income);
  remaining -= needs;
  allocations.push({
    key: 'needs',
    label: 'Essential Needs',
    amountPaise: needs,
    pct: pctOf(needs, income),
    rationale:
      'Rent, EMIs, food, transport, utilities and family support are funded first — these are non-negotiable monthly commitments.',
  });

  // 2) High-interest debt -----------------------------------------------------
  const expensiveDebt = debts.filter(
    (d) => (d.interestRate ?? 0) >= HIGH_INTEREST_THRESHOLD && d.principalOutstandingPaise > 0,
  );
  if (expensiveDebt.length > 0 && remaining > 0) {
    const extraPayment = Math.min(
      Math.round(remaining * DEBT_PAYDOWN_SURPLUS_SHARE),
      totalPrincipal(expensiveDebt),
    );
    if (extraPayment > 0) {
      remaining -= extraPayment;
      allocations.push({
        key: 'debt',
        label: 'Clear Expensive Debt',
        amountPaise: extraPayment,
        pct: pctOf(extraPayment, income),
        rationale: `You hold debt above ${HIGH_INTEREST_THRESHOLD}% p.a. Paying it down is a guaranteed, tax-free "return" higher than most investments — so it comes before investing.`,
      });
    }
  }

  // 3) Emergency fund ---------------------------------------------------------
  const monthlyEssential = essentialNeeds || Math.round(income * 0.5);
  const emergencyTarget = monthlyEssential * financials.emergencyMonthsTarget;
  const emergencyGap = Math.max(0, emergencyTarget - financials.emergencyFundPaise);
  if (emergencyGap > 0 && remaining > 0) {
    // Aim to close the gap within ~12 months, but never starve investing entirely.
    const monthlyTopUp = clamp(
      Math.round(emergencyGap / EMERGENCY_CLOSE_MONTHS),
      0,
      Math.round(remaining * EMERGENCY_MAX_SURPLUS_SHARE),
    );
    if (monthlyTopUp > 0) {
      remaining -= monthlyTopUp;
      allocations.push({
        key: 'emergency',
        label: 'Emergency Fund',
        amountPaise: monthlyTopUp,
        pct: pctOf(monthlyTopUp, income),
        rationale: `Your safety net covers ${(financials.emergencyFundPaise / Math.max(monthlyEssential, 1)).toFixed(1)} months. We top it up toward ${financials.emergencyMonthsTarget} months so a job loss or emergency never forces you into debt.`,
      });
    }
  }

  // 4) Investments ------------------------------------------------------------
  const investable = Math.max(0, remaining);
  const investAmount = Math.round(investable * mix.investShare);
  if (investAmount > 0) {
    allocations.push({
      key: 'investments',
      label: 'Investments',
      amountPaise: investAmount,
      pct: pctOf(investAmount, income),
      rationale: investmentRationale(profile.riskProfile, profile.taxRegime),
    });
    remaining -= investAmount;
  }

  // 5) Goals ------------------------------------------------------------------
  const activeGoals = goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority);
  if (activeGoals.length > 0 && remaining > 0) {
    const goalBudget = Math.round(remaining * GOAL_BUDGET_SURPLUS_SHARE);
    const breakdown = splitAcrossGoals(activeGoals, goalBudget);
    const totalGoal = breakdown.reduce((s, b) => s + b.amountPaise, 0);
    if (totalGoal > 0) {
      remaining -= totalGoal;
      allocations.push({
        key: 'goals',
        label: 'Goals',
        amountPaise: totalGoal,
        pct: pctOf(totalGoal, income),
        rationale:
          'Funded in priority order so your most important goals stay on track. Higher-priority goals receive a larger share.',
        breakdown,
      });
    }
  }

  // 6) Lifestyle (whatever remains, this is guilt-free spending) --------------
  const lifestyle = Math.max(0, remaining);
  allocations.push({
    key: 'lifestyle',
    label: 'Lifestyle (Guilt-Free)',
    amountPaise: lifestyle,
    pct: pctOf(lifestyle, income),
    rationale:
      'What’s left is yours to enjoy — dining, shopping, fun. Because your savings and goals are already handled, you can spend this without guilt.',
  });

  return {
    periodStart,
    periodEnd: null,
    incomePaise: income,
    allocations,
    summary: buildSummary(allocations, income),
    actionsTotal: allocations.filter((a) => a.amountPaise > 0).length,
    actionsDone: 0,
    generatedBy: 'engine',
  };
}

function investmentRationale(risk: string, regime: string): string {
  const base =
    regime === 'old'
      ? 'We route part of this into ELSS/PPF/NPS to also reduce your taxable income under 80C/80CCD.'
      : 'We prioritize low-cost index and diversified equity funds for long-term growth.';
  const tilt =
    risk === 'aggressive'
      ? 'Given your aggressive profile, the mix leans toward equity for higher long-term growth.'
      : risk === 'conservative'
        ? 'Given your conservative profile, the mix leans toward debt funds and PPF for stability.'
        : 'A balanced equity-debt split keeps growth and stability in check.';
  return `${tilt} ${base}`;
}

function splitAcrossGoals(goals: Goal[], budget: number): { label: string; amountPaise: number }[] {
  // Weight inversely by priority number (priority 1 gets the most).
  const weights = goals.map((g) => 1 / Math.max(1, g.priority));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return goals.map((g, i) => ({
    label: g.name,
    amountPaise: Math.round((weights[i]! / totalWeight) * budget),
  }));
}

function buildSummary(allocations: AllocationLine[], income: number): string {
  const invest = allocations.find((a) => a.key === 'investments')?.amountPaise ?? 0;
  const save =
    (allocations.find((a) => a.key === 'emergency')?.amountPaise ?? 0) + invest;
  const rate = income > 0 ? Math.round((save / income) * 100) : 0;
  return `This plan puts ${rate}% of your salary toward your future (savings + investments) while keeping your essentials covered and leaving room to enjoy life.`;
}

const totalPrincipal = (debts: Debt[]): number =>
  debts.reduce((s, d) => s + d.principalOutstandingPaise, 0);

const pctOf = (part: number, whole: number): number =>
  whole <= 0 ? 0 : Math.round((part / whole) * 1000) / 10;
