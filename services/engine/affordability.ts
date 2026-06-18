/**
 * Deterministic "can I afford X?" analysis used by the AI Coach as a tool.
 * The LLM never decides affordability — it calls this and narrates the result.
 */

import type { AIContext } from '@/types';
import { emi } from '@/utils/finance';
import { formatINR, formatINRCompact } from '@/utils/currency';

export interface AffordabilityResult {
  verdict: 'comfortable' | 'tight' | 'not_yet';
  headline: string;
  monthlyImpactPaise: number;
  monthsToSaveCash: number;
  emiPaise: number;
  emergencyImpact: string;
  goalDelayMonths: number;
  alternatives: string[];
  details: Record<string, string | number>;
}

export function analyzeAffordability(
  context: AIContext,
  item: string,
  costPaise: number,
  financing: 'cash' | 'emi' = 'cash',
): AffordabilityResult {
  const surplus = Math.max(0, context.financials.monthlySurplusPaise);
  const monthsToSaveCash = surplus > 0 ? Math.ceil(costPaise / surplus) : Infinity;

  // Assume a 36-month consumer loan at 11% for the EMI scenario.
  const monthlyEmi = emi(costPaise, 11, 36);

  // How much of the monthly surplus would the EMI consume?
  const emiShare = surplus > 0 ? monthlyEmi / surplus : Infinity;

  let verdict: AffordabilityResult['verdict'];
  if (financing === 'cash') {
    verdict = monthsToSaveCash <= 6 ? 'comfortable' : monthsToSaveCash <= 18 ? 'tight' : 'not_yet';
  } else {
    verdict = emiShare <= 0.3 ? 'comfortable' : emiShare <= 0.6 ? 'tight' : 'not_yet';
  }

  // Estimate delay to the top-priority non-emergency goal.
  const topGoal = context.goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority)[0];
  const goalDelayMonths =
    topGoal && surplus > 0 ? Math.ceil(costPaise / surplus) : 0;

  const headline = buildHeadline(verdict, item, financing, monthsToSaveCash, monthlyEmi);

  return {
    verdict,
    headline,
    monthlyImpactPaise: financing === 'emi' ? monthlyEmi : Math.round(costPaise / 12),
    monthsToSaveCash: Number.isFinite(monthsToSaveCash) ? monthsToSaveCash : 0,
    emiPaise: monthlyEmi,
    emergencyImpact:
      financing === 'cash' && costPaise > context.financials.emergencyFundPaise
        ? 'Paying fully in cash would dip into your emergency fund — not recommended.'
        : 'Your emergency fund stays intact.',
    goalDelayMonths: topGoal ? goalDelayMonths : 0,
    alternatives: buildAlternatives(verdict, item, costPaise),
    details: {
      cost: formatINR(costPaise),
      monthlySurplus: formatINR(surplus),
      emi36m: formatINR(monthlyEmi),
      monthsToSave: Number.isFinite(monthsToSaveCash) ? monthsToSaveCash : 'never at current surplus',
      topGoal: topGoal?.name ?? 'none',
    },
  };
}

function buildHeadline(
  verdict: AffordabilityResult['verdict'],
  item: string,
  financing: string,
  months: number,
  monthlyEmi: number,
): string {
  if (verdict === 'comfortable') {
    return financing === 'cash'
      ? `Yes — you can comfortably afford ${item}. Saving up takes about ${months} month${months === 1 ? '' : 's'}.`
      : `Yes — ${item} fits your budget at roughly ${formatINRCompact(monthlyEmi)}/month.`;
  }
  if (verdict === 'tight') {
    return `You can afford ${item}, but it’s tight. It will slow your other goals — here’s how to do it smartly.`;
  }
  return `Not yet. Buying ${item} now would strain your finances. A little patience makes it stress-free.`;
}

function buildAlternatives(
  verdict: AffordabilityResult['verdict'],
  item: string,
  costPaise: number,
): string[] {
  if (verdict === 'comfortable') return [];
  return [
    `Consider a lower-cost option (~${formatINRCompact(Math.round(costPaise * 0.65))}).`,
    `Wait 3–6 months and pay in cash to avoid interest.`,
    `Set up a dedicated mini-goal for ${item} so it doesn’t disturb your plan.`,
  ];
}
