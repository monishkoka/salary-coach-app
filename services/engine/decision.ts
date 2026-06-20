/**
 * Decision Engine (deterministic) — the "should I do X?" advisor.
 *
 * Given a purchase/commitment, it weighs the dimensions a real financial
 * advisor would: cash-flow strain, goal delay, emergency-fund safety, and the
 * long-run opportunity cost of not investing the money. It produces a verdict,
 * a 0–100 confidence score, dimension-by-dimension impacts, smarter
 * alternatives, and a full Trust breakdown (reasoning / assumptions / risks).
 *
 * The LLM never decides — it calls this and narrates the result. Every number
 * is traceable to the user's inputs and the documented assumptions.
 */

import type {
  AIContext,
  Decision,
  DecisionAlternative,
  DecisionImpact,
  DecisionVerdict,
  Trust,
} from '@/types';
import { emi, lumpSumFutureValue, clamp } from '@/utils/finance';
import { formatINR, formatINRCompact } from '@/utils/currency';
import { essentialMonthlyPaise } from './constants';

const EMI_TENURE_MONTHS = 36;
const EMI_RATE_PCT = 11; // representative consumer-loan rate
const OPPORTUNITY_YEARS = 5;

function investReturnPct(context: AIContext): number {
  const a = context.financials.assumptions;
  switch (context.profile.riskProfile) {
    case 'aggressive':
      return a.expectedReturnEquityPct;
    case 'conservative':
      return (a.expectedReturnEquityPct + a.expectedReturnDebtPct) / 2;
    default:
      return (a.expectedReturnEquityPct * 2 + a.expectedReturnDebtPct) / 3;
  }
}

export function evaluateDecision(
  context: AIContext,
  item: string,
  costPaise: number,
  financing: 'cash' | 'emi' = 'cash',
): Decision {
  const { financials } = context;
  const surplus = Math.max(0, financials.monthlySurplusPaise);
  const monthlyEmi = emi(costPaise, EMI_RATE_PCT, EMI_TENURE_MONTHS);
  const monthsToSaveCash = surplus > 0 ? Math.ceil(costPaise / surplus) : Infinity;
  const emiShare = surplus > 0 ? monthlyEmi / surplus : Infinity;

  // --- Dimension 1: cash flow ------------------------------------------------
  const cashSeverity =
    financing === 'emi'
      ? emiShare <= 0.2
        ? 'minor'
        : emiShare <= 0.4
          ? 'moderate'
          : 'severe'
      : monthsToSaveCash <= 4
        ? 'minor'
        : monthsToSaveCash <= 12
          ? 'moderate'
          : 'severe';
  const cashImpact: DecisionImpact = {
    key: 'cash_flow',
    label: 'Cash flow',
    severity: cashSeverity,
    detail:
      financing === 'emi'
        ? `An EMI of ${formatINRCompact(monthlyEmi)} would consume ${Math.round(
            clamp(emiShare * 100, 0, 999),
          )}% of your ${formatINRCompact(surplus)} monthly surplus.`
        : Number.isFinite(monthsToSaveCash)
          ? `Paying cash takes about ${monthsToSaveCash} month${monthsToSaveCash === 1 ? '' : 's'} of surplus to rebuild.`
          : `You have no monthly surplus to absorb this right now.`,
    valuePaise: financing === 'emi' ? -monthlyEmi : -costPaise,
  };

  // --- Dimension 2: goal impact ---------------------------------------------
  const topGoal = context.goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority)[0];
  const goalDelayMonths =
    topGoal && surplus > 0 && financing === 'cash' ? Math.ceil(costPaise / surplus) : 0;
  const goalSeverity = !topGoal
    ? 'neutral'
    : goalDelayMonths === 0
      ? 'minor'
      : goalDelayMonths <= 3
        ? 'moderate'
        : 'severe';
  const goalImpact: DecisionImpact = {
    key: 'goals',
    label: 'Goal impact',
    severity: goalSeverity,
    detail: !topGoal
      ? 'No active goals would be delayed.'
      : goalDelayMonths > 0
        ? `Diverting this cash pushes "${topGoal.name}" out by roughly ${goalDelayMonths} month${goalDelayMonths === 1 ? '' : 's'}.`
        : `"${topGoal.name}" stays on schedule — the EMI comes from monthly cash flow, not your goal fund.`,
    valuePaise: null,
  };

  // --- Dimension 3: emergency fund safety -----------------------------------
  const monthlyEssential = Math.max(1, essentialMonthlyPaise(context));
  // Cash beyond the emergency buffer is "free" to spend; anything more eats into it.
  const freeCashPaise = Math.max(0, financials.totalSavingsPaise - financials.emergencyFundPaise);
  const dipsIntoEmergency = financing === 'cash' && costPaise > freeCashPaise;
  const emergencySeverity = financing === 'emi' ? 'neutral' : dipsIntoEmergency ? 'severe' : 'minor';
  const emergencyImpact: DecisionImpact = {
    key: 'emergency',
    label: 'Emergency fund',
    severity: emergencySeverity,
    detail:
      financing === 'emi'
        ? 'Financing keeps your emergency fund fully intact.'
        : dipsIntoEmergency
          ? `Paying fully in cash would erode your safety buffer (currently ${(
              financials.emergencyFundPaise / monthlyEssential
            ).toFixed(1)} months). Not recommended.`
          : 'Your emergency fund stays fully intact.',
    valuePaise: null,
  };

  // --- Dimension 4: investment opportunity cost ------------------------------
  const r = investReturnPct(context);
  const fvIfInvested = lumpSumFutureValue(costPaise, r, OPPORTUNITY_YEARS * 12);
  const opportunityCost = fvIfInvested - costPaise;
  const opportunityImpact: DecisionImpact = {
    key: 'opportunity_cost',
    label: 'Opportunity cost',
    severity: opportunityCost > costPaise * 0.5 ? 'moderate' : 'minor',
    detail: `Invested instead at ${r.toFixed(0)}% p.a., ${formatINRCompact(
      costPaise,
    )} could grow to ${formatINRCompact(fvIfInvested)} in ${OPPORTUNITY_YEARS} years — a ${formatINRCompact(
      opportunityCost,
    )} trade-off.`,
    valuePaise: -opportunityCost,
  };

  const impacts: DecisionImpact[] = [cashImpact, goalImpact, emergencyImpact, opportunityImpact];

  // --- Confidence + verdict --------------------------------------------------
  const confidence = scoreConfidence({
    financing,
    emiShare,
    monthsToSaveCash,
    dipsIntoEmergency,
    surplus,
  });
  const verdict: DecisionVerdict = confidence >= 70 ? 'go' : confidence >= 45 ? 'caution' : 'wait';

  const headline = buildHeadline(verdict, item, financing, monthsToSaveCash, monthlyEmi);
  const alternatives = buildAlternatives(verdict, item, costPaise, surplus, financing);
  const trust = buildTrust({
    context,
    financing,
    verdict,
    monthsToSaveCash,
    emiShare,
    dipsIntoEmergency,
    confidence,
    r,
  });

  return {
    item,
    costPaise,
    financing,
    verdict,
    confidence,
    headline,
    impacts,
    alternatives,
    trust,
    details: {
      cost: formatINR(costPaise),
      monthlySurplus: formatINR(surplus),
      emi36m: formatINR(monthlyEmi),
      monthsToSave: Number.isFinite(monthsToSaveCash) ? monthsToSaveCash : 'never at current surplus',
      confidence: `${confidence}/100`,
      opportunityCost5y: formatINR(opportunityCost),
      topGoal: topGoal?.name ?? 'none',
    },
  };
}

function scoreConfidence(inp: {
  financing: 'cash' | 'emi';
  emiShare: number;
  monthsToSaveCash: number;
  dipsIntoEmergency: boolean;
  surplus: number;
}): number {
  // Start optimistic; subtract for each strain signal. Bounded 0–100.
  let score = 85;
  if (inp.surplus <= 0) return 5;

  if (inp.financing === 'cash') {
    if (inp.monthsToSaveCash > 18) score -= 45;
    else if (inp.monthsToSaveCash > 12) score -= 30;
    else if (inp.monthsToSaveCash > 6) score -= 15;
    if (inp.dipsIntoEmergency) score -= 35;
  } else {
    if (inp.emiShare > 0.6) score -= 50;
    else if (inp.emiShare > 0.4) score -= 30;
    else if (inp.emiShare > 0.25) score -= 12;
    // EMIs always carry interest drag → small penalty.
    score -= 8;
  }
  return clamp(Math.round(score), 0, 100);
}

function buildHeadline(
  verdict: DecisionVerdict,
  item: string,
  financing: string,
  months: number,
  monthlyEmi: number,
): string {
  if (verdict === 'go') {
    return financing === 'cash'
      ? `Yes — you can comfortably afford ${item}. Saving up takes about ${months} month${months === 1 ? '' : 's'}.`
      : `Yes — ${item} fits your budget at roughly ${formatINRCompact(monthlyEmi)}/month.`;
  }
  if (verdict === 'caution') {
    return `You can do ${item}, but it's tight — it will slow your other goals. Here's how to do it smartly.`;
  }
  return `Not yet. Buying ${item} now would strain your finances. A little patience makes it stress-free.`;
}

function buildAlternatives(
  verdict: DecisionVerdict,
  item: string,
  costPaise: number,
  surplus: number,
  financing: 'cash' | 'emi',
): DecisionAlternative[] {
  if (verdict === 'go') return [];
  const alts: DecisionAlternative[] = [
    {
      title: 'Choose a leaner option',
      detail: `A version around ${formatINRCompact(Math.round(costPaise * 0.65))} would clear the "go" threshold.`,
      amountPaise: Math.round(costPaise * 0.65),
    },
  ];
  if (financing === 'emi') {
    alts.push({
      title: 'Pay cash instead',
      detail: 'Avoid the interest drag by saving up and buying outright.',
      amountPaise: null,
    });
  } else if (surplus > 0) {
    const months = Math.ceil((costPaise * 0.65) / surplus);
    alts.push({
      title: 'Wait and auto-save',
      detail: `Park ${formatINRCompact(Math.round(surplus * 0.4))}/mo into a dedicated bucket — ready in about ${months} months without disturbing your plan.`,
      amountPaise: null,
    });
  }
  return alts;
}

function buildTrust(inp: {
  context: AIContext;
  financing: 'cash' | 'emi';
  verdict: DecisionVerdict;
  monthsToSaveCash: number;
  emiShare: number;
  dipsIntoEmergency: boolean;
  confidence: number;
  r: number;
}): Trust {
  const reasoning: string[] = [];
  if (inp.financing === 'cash') {
    reasoning.push(
      Number.isFinite(inp.monthsToSaveCash)
        ? `At your current surplus it takes ~${inp.monthsToSaveCash} months to fund this in cash.`
        : 'You currently have no surplus to fund this in cash.',
    );
    if (inp.dipsIntoEmergency) reasoning.push('Paying cash would draw down your emergency buffer.');
  } else {
    reasoning.push(
      `A 36-month EMI would use ~${Math.round(clamp(inp.emiShare * 100, 0, 999))}% of your monthly surplus.`,
    );
  }
  reasoning.push(
    inp.verdict === 'go'
      ? 'All four dimensions stay within healthy limits, so the engine endorses going ahead.'
      : inp.verdict === 'caution'
        ? 'It is affordable but at least one dimension is strained, so proceed deliberately.'
        : 'Multiple dimensions are strained, so the engine recommends waiting.',
  );

  return {
    reasoning,
    confidence: inp.confidence,
    assumptions: [
      `Consumer EMI modelled at ${EMI_RATE_PCT}% p.a. over ${EMI_TENURE_MONTHS} months.`,
      `Opportunity cost modelled at ${inp.r.toFixed(0)}% p.a. for ${OPPORTUNITY_YEARS} years (your ${inp.context.profile.riskProfile} profile).`,
      'Monthly surplus is treated as stable and available.',
    ],
    risks: [
      'A future income shock or unplanned expense would change this verdict.',
      inp.financing === 'emi'
        ? 'EMIs reduce flexibility — early closure or rate changes affect the total cost.'
        : 'Spending the cash removes a buffer you cannot instantly rebuild.',
    ],
  };
}
