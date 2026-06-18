/**
 * Action Plan engine (deterministic).
 *
 * Turns the user's financial state into a prioritized, quantified answer to
 * "what should I do next?". Surfaces the single biggest mistake (most costly
 * current behavior) and the single biggest opportunity (highest-leverage move),
 * plus an ordered list of concrete actions. The AI coach narrates these; it
 * never invents the numbers.
 */

import type { ActionPlan, ActionPlanItem, AIContext } from '@/types';
import { formatINRCompact } from '@/utils/currency';
import { monthsToTarget } from '@/utils/finance';
import {
  HIGH_INTEREST_PCT,
  INFLATION_PCT,
  SAVINGS_RATE_FLOOR_PCT,
  SAVINGS_RATE_TARGET_PCT,
  SIP_TARGET_PCT,
} from './constants';

const HIGH_INTEREST = HIGH_INTEREST_PCT;

export function buildActionPlan(context: AIContext): ActionPlan {
  const items = collectItems(context).sort((a, b) => a.priority - b.priority);

  const biggestMistake = detectBiggestMistake(context);
  const biggestOpportunity = detectBiggestOpportunity(context);

  return { biggestMistake, biggestOpportunity, items };
}

function collectItems(context: AIContext): ActionPlanItem[] {
  const { financials, debts, investments, goals } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);
  const surplus = Math.max(0, financials.monthlySurplusPaise);
  const items: ActionPlanItem[] = [];

  // 1) Expensive debt.
  const expensive = debts
    .filter((d) => (d.interestRate ?? 0) >= HIGH_INTEREST && d.principalOutstandingPaise > 0)
    .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  if (expensive.length) {
    const d = expensive[0]!;
    const annualInterest = Math.round((d.principalOutstandingPaise * (d.interestRate ?? 0)) / 100);
    items.push({
      id: `debt-${d.id}`,
      category: 'debt',
      title: `Clear your ${formatINRCompact(d.principalOutstandingPaise)} ${d.label ?? 'high-interest debt'}`,
      body: `At ${d.interestRate}% p.a. this is your most expensive money. Paying it off is a guaranteed, tax-free return higher than any investment.`,
      amountPaise: d.principalOutstandingPaise,
      impactLabel: `Saves ~${formatINRCompact(annualInterest)}/yr in interest`,
      priority: 1,
      effort: 'medium',
    });
  }

  // 2) Emergency fund gap.
  const monthlyEssential = Math.max(1, financials.totalExpensesPaise);
  const emergencyTarget = monthlyEssential * financials.emergencyMonthsTarget;
  const emergencyGap = Math.max(0, emergencyTarget - financials.emergencyFundPaise);
  if (emergencyGap > 0) {
    const monthsCovered = financials.emergencyFundPaise / monthlyEssential;
    items.push({
      id: 'emergency',
      category: 'emergency',
      title: `Build your emergency fund to ${financials.emergencyMonthsTarget} months`,
      body: `You currently cover ${monthsCovered.toFixed(1)} months. A full buffer means a job loss never forces you into debt.`,
      amountPaise: emergencyGap,
      impactLabel: `Closes a ${formatINRCompact(emergencyGap)} safety gap`,
      priority: expensive.length ? 2 : 1,
      effort: 'medium',
    });
  }

  // 3) Under-investing relative to surplus.
  const sipTotal = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  const sipRate = (sipTotal / income) * 100;
  if (surplus > 0 && sipRate < SIP_TARGET_PCT) {
    const suggested = Math.round(surplus * 0.5);
    items.push({
      id: 'invest-more',
      category: 'investment',
      title: `Put ${formatINRCompact(suggested)}/mo to work`,
      body: `You invest about ${Math.round(sipRate)}% of income today. Your surplus can support more without touching essentials.`,
      amountPaise: suggested,
      impactLabel: 'Accelerates every long-term goal',
      priority: 3,
      effort: 'low',
    });
  }

  // 4) Goals at risk.
  const atRisk = goals.filter((g) => g.status === 'at_risk');
  atRisk.forEach((g, idx) => {
    const needed = monthsToTarget(
      g.targetAmountPaise,
      g.currentAmountPaise,
      Math.max(1, g.monthlyContributionPaise),
      context.financials.assumptions.expectedReturnEquityPct,
    );
    items.push({
      id: `goal-${g.id}`,
      category: 'goal',
      title: `${g.name} is falling behind`,
      body: `At the current pace this goal takes about ${Math.round(needed / 12)} years. Raising the monthly amount puts it back on track.`,
      amountPaise: null,
      impactLabel: 'Gets an at-risk goal back on track',
      priority: 4 + idx,
      effort: 'low',
    });
  });

  // 5) Insurance gap (dependents, no obvious term cover modeled).
  const hasDependents = Object.values(context.profile.dependents ?? {}).some((n) => n > 0);
  if (hasDependents) {
    items.push({
      id: 'insurance',
      category: 'insurance',
      title: 'Check your term life cover',
      body: 'With people depending on your income, a pure term plan (~₹900/mo for ₹1Cr) protects them if anything happens to you.',
      amountPaise: 90000,
      impactLabel: 'Protects dependents for ~₹30/day',
      priority: 6,
      effort: 'low',
    });
  }

  return items;
}

function detectBiggestMistake(context: AIContext): ActionPlan['biggestMistake'] {
  const { debts, financials } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);

  const expensive = debts
    .filter((d) => (d.interestRate ?? 0) >= HIGH_INTEREST && d.principalOutstandingPaise > 0)
    .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  if (expensive.length) {
    const d = expensive[0]!;
    const annualInterest = Math.round((d.principalOutstandingPaise * (d.interestRate ?? 0)) / 100);
    return {
      title: `${d.interestRate}% debt is quietly draining you`,
      body: `Carrying ${formatINRCompact(d.principalOutstandingPaise)} on your ${d.label ?? 'card'} costs you more than any investment earns. Clear it first.`,
      costLabel: `${formatINRCompact(annualInterest)}/yr lost to interest`,
    };
  }

  // Lifestyle leakage: very low savings rate.
  const savingsRate = (financials.monthlySurplusPaise / income) * 100;
  if (savingsRate < SAVINGS_RATE_FLOOR_PCT) {
    const ideal = Math.round(income * (SAVINGS_RATE_TARGET_PCT / 100));
    return {
      title: 'Lifestyle is eating your future',
      body: `You keep only ${Math.round(savingsRate)}% of your income. Lifting that toward ${SAVINGS_RATE_TARGET_PCT}% is the difference between drifting and building wealth.`,
      costLabel: `~${formatINRCompact(ideal)}/mo not yet saved`,
    };
  }

  // Idle cash beyond a healthy buffer.
  const monthlyEssential = Math.max(1, financials.totalExpensesPaise);
  const idle = financials.totalSavingsPaise - monthlyEssential * financials.emergencyMonthsTarget;
  if (idle > monthlyEssential * 2) {
    return {
      title: 'Idle cash is losing to inflation',
      body: `About ${formatINRCompact(idle)} sits beyond your emergency buffer. In a savings account it loses value every year to inflation.`,
      costLabel: `${formatINRCompact(Math.round(idle * (INFLATION_PCT / 100)))}/yr lost to inflation`,
    };
  }

  return null;
}

function detectBiggestOpportunity(context: AIContext): ActionPlan['biggestOpportunity'] {
  const { financials, investments, goals } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);
  const surplus = Math.max(0, financials.monthlySurplusPaise);
  const sipTotal = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  const sipRate = (sipTotal / income) * 100;

  // Top goal that could be pulled forward with more investing.
  const topGoal = goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority)[0];

  if (topGoal && surplus > 0) {
    const baseMonths = monthsToTarget(
      topGoal.targetAmountPaise,
      topGoal.currentAmountPaise,
      Math.max(1, topGoal.monthlyContributionPaise),
      financials.assumptions.expectedReturnEquityPct,
    );
    const boosted = monthsToTarget(
      topGoal.targetAmountPaise,
      topGoal.currentAmountPaise,
      Math.max(1, topGoal.monthlyContributionPaise) + Math.round(surplus * 0.3),
      financials.assumptions.expectedReturnEquityPct,
    );
    const saved = baseMonths - boosted;
    if (saved >= 2) {
      return {
        title: `Pull ${topGoal.name} forward`,
        body: `Adding ${formatINRCompact(Math.round(surplus * 0.3))}/mo from your surplus reaches this goal meaningfully sooner.`,
        upsideLabel: `${Math.round(saved)} months sooner`,
      };
    }
  }

  if (sipRate < SIP_TARGET_PCT && surplus > 0) {
    return {
      title: 'Compound your surplus',
      body: `Your investing rate is ${Math.round(sipRate)}%. Automating a higher SIP turns today's surplus into tomorrow's freedom.`,
      upsideLabel: `${formatINRCompact(Math.round(surplus * 0.5))}/mo available to invest`,
    };
  }

  return {
    title: 'Keep your momentum',
    body: 'Your fundamentals are strong. Small annual step-ups in your SIP keep compounding working hard for you.',
    upsideLabel: 'Step up 10% at your next appraisal',
  };
}
