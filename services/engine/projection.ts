/**
 * Forecasting / Simulation engine (deterministic).
 *
 * Powers two signature features:
 *   - Money GPS 2.0: four routes (Current / Recommended / Aggressive / Safe)
 *     showing how behaviour changes the user's destination.
 *   - Future Self Simulator: net worth / savings / investments under multiple
 *     behaviour scenarios at 1 / 3 / 5 / 10 / 15 years and at retirement.
 *
 * Like the rest of the engine, the AI never invents these numbers — it narrates
 * them. All math is pure, paise-based, and traceable to the user's inputs and
 * the documented assumptions (returns, inflation, salary growth).
 */

import type {
  AIContext,
  GpsRoute,
  MoneyGps,
  ProjectionPoint,
  RetirementReadiness,
  RouteKind,
  ScenarioId,
  ScenarioProjection,
  Trust,
} from '@/types';
import { clamp, monthsToTarget } from '@/utils/finance';
import { formatINRCompact } from '@/utils/currency';
import { essentialMonthlyPaise, riskMix } from './constants';

const MAX_MONTHS = 600;
const DEFAULT_AGE = 30;
const DEFAULT_RETIREMENT_AGE = 60;

/** Months from now until the user's retirement age (bounded, default-safe). */
function retirementMonths(context: AIContext): number {
  const age = context.profile.age ?? DEFAULT_AGE;
  const retireAge = context.financials.assumptions.retirementAge || DEFAULT_RETIREMENT_AGE;
  const yrs = clamp(retireAge - age, 5, 45);
  return Math.round(yrs * 12);
}

/** Blended expected return by risk profile, in % p.a. for the investment bucket. */
function investReturnPct(context: AIContext): number {
  const a = context.financials.assumptions;
  switch (context.profile.riskProfile) {
    case 'aggressive':
      return a.expectedReturnEquityPct + 0.5; // tilt equity-heavy
    case 'conservative':
      return (a.expectedReturnEquityPct + a.expectedReturnDebtPct * 2) / 3;
    default:
      return (a.expectedReturnEquityPct + a.expectedReturnDebtPct) / 2;
  }
}

/**
 * Share of investable surplus the user currently directs to investing. Shared
 * with the blueprint waterfall via RISK_MIX so the "current route" the GPS shows
 * matches the allocation the blueprint actually recommends.
 */
function currentInvestShare(context: AIContext): number {
  return riskMix(context.profile.riskProfile).investShare;
}

interface TrajectoryInputs {
  startInvestmentsPaise: number;
  startSavingsPaise: number;
  debtPaise: number;
  monthlyInvestPaise: number;
  monthlySavePaise: number;
  investReturnPct: number;
  saveReturnPct: number;
  salaryGrowthPct: number;
}

/**
 * Project investments + savings buckets month by month, compounding monthly and
 * stepping up contributions once a year by the salary-growth rate. Net worth is
 * investments + savings − (constant) debt. Returns sampled points.
 */
function projectTrajectory(inp: TrajectoryInputs, months: number[]): ProjectionPoint[] {
  const rInvest = inp.investReturnPct / 100 / 12;
  const rSave = inp.saveReturnPct / 100 / 12;
  const target = Math.max(...months);

  let investments = inp.startInvestmentsPaise;
  let savings = inp.startSavingsPaise;
  let invContribution = inp.monthlyInvestPaise;
  let saveContribution = inp.monthlySavePaise;

  const wanted = new Set(months);
  const out: ProjectionPoint[] = [];

  const pushPoint = (m: number) => {
    out.push({
      month: m,
      investmentsPaise: Math.round(investments),
      savingsPaise: Math.round(savings),
      netWorthPaise: Math.round(investments + savings - inp.debtPaise),
    });
  };

  if (wanted.has(0)) pushPoint(0);

  for (let m = 1; m <= target; m += 1) {
    investments = investments * (1 + rInvest) + invContribution;
    savings = savings * (1 + rSave) + saveContribution;
    // Annual salary-growth step-up on contributions.
    if (m % 12 === 0) {
      const g = 1 + inp.salaryGrowthPct / 100;
      invContribution *= g;
      saveContribution *= g;
    }
    if (wanted.has(m)) pushPoint(m);
  }

  return out;
}

interface BaseInputs {
  surplus: number;
  sipTotal: number;
  investShare: number;
  startInvestments: number;
  startSavings: number;
  debt: number;
  investReturn: number;
  saveReturn: number;
  salaryGrowth: number;
}

function baseInputs(context: AIContext): BaseInputs {
  const { financials, investments } = context;
  const surplus = Math.max(0, financials.monthlySurplusPaise);
  const sipTotal = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  return {
    surplus,
    sipTotal,
    investShare: currentInvestShare(context),
    startInvestments: financials.totalInvestmentsPaise,
    startSavings: financials.totalSavingsPaise,
    debt: financials.totalDebtPaise,
    investReturn: investReturnPct(context),
    saveReturn: financials.assumptions.expectedReturnDebtPct,
    salaryGrowth: financials.assumptions.salaryGrowthPct,
  };
}

// =============================================================================
// Future Self Simulator
// =============================================================================

const SCENARIO_META: Record<ScenarioId, { label: string; description: string }> = {
  current: { label: 'Current Path', description: 'If you keep doing exactly what you do today.' },
  save_more: { label: 'Save 10% More', description: 'Redirect 10% of your salary from lifestyle into saving & investing.' },
  invest_aggressive: { label: 'Invest Aggressively', description: 'Shift your safe savings into long-term investments for higher growth.' },
  reduce_lifestyle: { label: 'Trim Lifestyle 15%', description: 'Cut discretionary spend 15% and route it to your future.' },
  salary_jump: { label: 'Next Raise (+20%)', description: 'Bank your next appraisal instead of inflating your lifestyle.' },
};

/** Monthly invest/save contributions for a given scenario. */
function scenarioContributions(
  id: ScenarioId,
  base: BaseInputs,
  incomePaise: number,
): { invest: number; save: number; investReturn: number } {
  const baseInvest = base.sipTotal + base.surplus * base.investShare;
  const baseSave = base.surplus * (1 - base.investShare);

  switch (id) {
    case 'save_more': {
      const extra = incomePaise * 0.1;
      return {
        invest: baseInvest + extra * base.investShare,
        save: baseSave + extra * (1 - base.investShare),
        investReturn: base.investReturn,
      };
    }
    case 'invest_aggressive':
      // Move the safe-savings flow into investments; bump return modestly.
      return {
        invest: baseInvest + baseSave,
        save: 0,
        investReturn: base.investReturn + 1.5,
      };
    case 'reduce_lifestyle': {
      const extra = base.surplus * 0.15;
      return {
        invest: baseInvest + extra * base.investShare,
        save: baseSave + extra * (1 - base.investShare),
        investReturn: base.investReturn,
      };
    }
    case 'salary_jump': {
      // A 20% raise, fully banked (lifestyle held flat).
      const raise = incomePaise * 0.2;
      return {
        invest: baseInvest + raise * base.investShare,
        save: baseSave + raise * (1 - base.investShare),
        investReturn: base.investReturn,
      };
    }
    case 'current':
    default:
      return { invest: baseInvest, save: baseSave, investReturn: base.investReturn };
  }
}

function buildScenario(id: ScenarioId, context: AIContext, retireMonth: number): ScenarioProjection {
  const base = baseInputs(context);
  const income = context.financials.monthlyIncomePaise;
  const c = scenarioContributions(id, base, income);

  const sampleMonths = Array.from(new Set([0, 12, 36, 60, 120, 180, retireMonth])).sort(
    (a, b) => a - b,
  );

  const points = projectTrajectory(
    {
      startInvestmentsPaise: base.startInvestments,
      startSavingsPaise: base.startSavings,
      debtPaise: base.debt,
      monthlyInvestPaise: c.invest,
      monthlySavePaise: c.save,
      investReturnPct: c.investReturn,
      saveReturnPct: base.saveReturn,
      salaryGrowthPct: base.salaryGrowth,
    },
    sampleMonths,
  );

  const at = (m: number) => points.find((p) => p.month === m)?.netWorthPaise ?? 0;
  const netWorthAt = {
    y1: at(12),
    y3: at(36),
    y5: at(60),
    y10: at(120),
    y15: at(180),
    retirement: at(retireMonth),
  };

  // Goals achievable within 10 years using this scenario's monthly investing pace.
  const monthlyPace = c.invest + c.save;
  const goalsAchievable = context.goals.filter((g) => {
    if (g.status === 'achieved' || g.type === 'emergency') return false;
    const m = monthsToTarget(
      g.targetAmountPaise,
      g.currentAmountPaise,
      Math.max(g.monthlyContributionPaise, monthlyPace * 0.3),
      base.investReturn,
    );
    return m <= 120;
  }).length;

  return {
    id,
    label: SCENARIO_META[id].label,
    description: SCENARIO_META[id].description,
    points,
    netWorthAt,
    retirementCorpusPaise: at(retireMonth),
    retirementMonth: retireMonth,
    goalsAchievable,
    upliftVsCurrentPaise: 0, // filled in by simulateScenarios
  };
}

/**
 * Future Self Simulator: project all behaviour scenarios and compute each one's
 * net-worth uplift vs the current path at the 10-year horizon.
 */
export function simulateScenarios(context: AIContext): ScenarioProjection[] {
  const retireMonth = retirementMonths(context);
  const ids: ScenarioId[] = [
    'current',
    'save_more',
    'invest_aggressive',
    'reduce_lifestyle',
    'salary_jump',
  ];
  const scenarios = ids.map((id) => buildScenario(id, context, retireMonth));
  const currentNw10 = scenarios[0]!.netWorthAt.y10;
  return scenarios.map((s) => ({
    ...s,
    upliftVsCurrentPaise: s.netWorthAt.y10 - currentNw10,
  }));
}

// =============================================================================
// Money GPS 2.0 — four routes
// =============================================================================

function retirementReadiness(context: AIContext, netWorth10y: number): RetirementReadiness {
  // Compare projected 10y net worth to a "10x current annual expenses" milestone
  // (a coarse proxy for being meaningfully on track toward independence).
  const annualExpense = Math.max(1, context.financials.totalExpensesPaise * 12);
  const ratio = netWorth10y / (annualExpense * 10);
  if (ratio >= 1.3) return 'strong';
  if (ratio >= 0.7) return 'moderate';
  return 'weak';
}

const ROUTE_META: Record<RouteKind, { label: string; description: string }> = {
  current: { label: 'Current path', description: 'Where today’s habits lead if nothing changes.' },
  recommended: { label: 'Recommended', description: 'The balanced route your coach optimises for.' },
  aggressive: { label: 'Aggressive', description: 'Maximum growth — most surplus invested, higher risk.' },
  safe: { label: 'Safe', description: 'Security first — bigger buffer, gentler growth.' },
};

interface RouteShape {
  /** Monthly amount routed to investing. */
  invest: number;
  /** Monthly amount routed to safe savings. */
  save: number;
  /** Monthly amount routed to the emergency fund. */
  emergency: number;
  /** Per-goal funding multiplier of total monthly pace. */
  goalShare: number;
}

function routeShape(kind: RouteKind, base: BaseInputs, income: number): RouteShape {
  switch (kind) {
    case 'recommended':
      return {
        invest: base.sipTotal + base.surplus * 0.6 + income * 0.05,
        save: base.surplus * 0.15,
        emergency: Math.max(base.surplus * 0.25, income * 0.04),
        goalShare: 0.35,
      };
    case 'aggressive':
      return {
        invest: base.sipTotal + base.surplus * 0.85 + income * 0.05,
        save: 0,
        emergency: base.surplus * 0.15,
        goalShare: 0.45,
      };
    case 'safe':
      return {
        invest: base.sipTotal + base.surplus * 0.35,
        save: base.surplus * 0.3,
        emergency: Math.max(base.surplus * 0.35, income * 0.05),
        goalShare: 0.25,
      };
    case 'current':
    default:
      return {
        invest: base.sipTotal + base.surplus * base.investShare,
        save: base.surplus * (1 - base.investShare),
        emergency: base.surplus * 0.2,
        goalShare: base.investShare * 0.5,
      };
  }
}

function buildRoute(context: AIContext, kind: RouteKind): GpsRoute {
  const base = baseInputs(context);
  const income = context.financials.monthlyIncomePaise;
  const shape = routeShape(kind, base, income);

  const investReturn = kind === 'aggressive' ? base.investReturn + 1.5 : base.investReturn;

  const points = projectTrajectory(
    {
      startInvestmentsPaise: base.startInvestments,
      startSavingsPaise: base.startSavings,
      debtPaise: base.debt,
      monthlyInvestPaise: shape.invest,
      monthlySavePaise: shape.save,
      investReturnPct: investReturn,
      saveReturnPct: base.saveReturn,
      salaryGrowthPct: base.salaryGrowth,
    },
    [120],
  );
  const netWorth10y = points[0]?.netWorthPaise ?? 0;

  // Emergency fund completion (sized against essential spend).
  const monthlyEssential = Math.max(1, essentialMonthlyPaise(context));
  const emergencyTarget = monthlyEssential * context.financials.emergencyMonthsTarget;
  const emergencyGap = Math.max(0, emergencyTarget - context.financials.emergencyFundPaise);
  const emergencyMonths =
    emergencyGap <= 0 ? null : shape.emergency > 0 ? Math.ceil(emergencyGap / shape.emergency) : MAX_MONTHS;

  // Per-goal ETAs.
  const goalPace = shape.invest + shape.save;
  const goalEtas = context.goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority)
    .map((g) => ({
      goalId: g.id,
      name: g.name,
      icon: g.icon,
      months: monthsToTarget(
        g.targetAmountPaise,
        g.currentAmountPaise,
        Math.max(g.monthlyContributionPaise, goalPace * shape.goalShare),
        investReturn,
      ),
    }));

  // Velocity proxy: how fast net worth is compounding on this route.
  const investmentRatePct = (shape.invest / Math.max(1, income)) * 100;
  const velocityScore = Math.round(clamp((investmentRatePct / 35) * 100, 0, 100));

  return {
    kind,
    label: ROUTE_META[kind].label,
    description: ROUTE_META[kind].description,
    emergencyMonths,
    goalEtas,
    retirement: retirementReadiness(context, netWorth10y),
    velocityScore,
    netWorth10yPaise: netWorth10y,
    monthlyInvestPaise: Math.round(shape.invest),
  };
}

function buildGpsTrust(context: AIContext, current: GpsRoute, recommended: GpsRoute): Trust {
  const reasoning: string[] = [
    `The recommended route directs about ${formatINRCompact(recommended.monthlyInvestPaise)}/mo to investing vs ${formatINRCompact(
      current.monthlyInvestPaise,
    )}/mo today.`,
  ];
  if (recommended.netWorth10yPaise > current.netWorth10yPaise) {
    reasoning.push(
      `That lifts your projected 10-year net worth by ${formatINRCompact(
        recommended.netWorth10yPaise - current.netWorth10yPaise,
      )}.`,
    );
  }
  // Data-completeness drives confidence.
  let confidence = 75;
  if (context.financials.monthlySurplusPaise <= 0) confidence -= 35;
  if (context.investments.length === 0) confidence -= 10;
  if ((context.profile.age ?? 0) === 0) confidence -= 5;

  return {
    reasoning,
    confidence: clamp(confidence, 0, 100),
    assumptions: [
      `Investments compound at ${investReturnPct(context).toFixed(0)}% p.a. (${context.profile.riskProfile} profile).`,
      `Contributions step up ${context.financials.assumptions.salaryGrowthPct}% a year with your salary.`,
      'Essential spending and surplus stay broadly stable.',
    ],
    risks: [
      'Market returns vary year to year — projections are a central estimate, not a guarantee.',
      'A lifestyle or income change would shift the route.',
    ],
  };
}

/** Money GPS 2.0: four routes + a one-line correction and a trust breakdown. */
export function buildMoneyGps(context: AIContext): MoneyGps {
  const current = buildRoute(context, 'current');
  const recommended = buildRoute(context, 'recommended');
  const aggressive = buildRoute(context, 'aggressive');
  const safe = buildRoute(context, 'safe');

  const topGoal = recommended.goalEtas[0];
  const currentTop = current.goalEtas[0];
  let correction: string;
  if (topGoal && currentTop && currentTop.months - topGoal.months >= 2) {
    const saved = Math.round(((currentTop.months - topGoal.months) / 12) * 10) / 10;
    correction = `Re-routing your surplus reaches ${topGoal.name} about ${saved} year${saved === 1 ? '' : 's'} sooner.`;
  } else if (
    current.emergencyMonths &&
    recommended.emergencyMonths &&
    current.emergencyMonths > recommended.emergencyMonths
  ) {
    correction = `The recommended route fully funds your emergency buffer in ${recommended.emergencyMonths} months instead of ${current.emergencyMonths}.`;
  } else {
    correction = 'You are already close to your optimal route — small step-ups keep compounding in your favor.';
  }

  return {
    current,
    recommended,
    routes: [current, recommended, aggressive, safe],
    correction,
    trust: buildGpsTrust(context, current, recommended),
  };
}
