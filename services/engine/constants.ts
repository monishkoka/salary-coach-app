/**
 * Financial policy constants — the single source of truth for the deterministic
 * engine's tunable knobs.
 *
 * Previously these magic numbers were duplicated across blueprint.ts,
 * actionPlan.ts, projection.ts, insights.ts and scores.ts, which meant a policy
 * change (e.g. "treat debt above 12% as expensive") had to be made in several
 * places and could silently drift. Centralizing them here keeps the engine
 * internally consistent and makes the product's financial philosophy auditable
 * in one file — important for trust, compliance review, and investor diligence.
 */

import type { AIContext, RiskProfile } from '@/types';

/** Debt at or above this annual rate (%) is treated as "expensive" and paid before investing. */
export const HIGH_INTEREST_PCT = 14;

/** Healthy minimum savings rate (% of income). Below this, lifestyle is flagged as the biggest mistake. */
export const SAVINGS_RATE_FLOOR_PCT = 15;

/** Target savings rate (% of income) we nudge users toward. */
export const SAVINGS_RATE_TARGET_PCT = 20;

/** Target SIP / recurring-investment rate (% of income). Below this we surface "invest more". */
export const SIP_TARGET_PCT = 20;

/** Discretionary spend above this share of income is flagged as lifestyle creep. */
export const DISCRETIONARY_FLAG_PCT = 20;

/** Long-run inflation assumption used to quantify the cost of idle cash. */
export const INFLATION_PCT = 5;

/** Blueprint waterfall shares. */
export const DEBT_PAYDOWN_SURPLUS_SHARE = 0.3;
export const EMERGENCY_MAX_SURPLUS_SHARE = 0.4;
export const EMERGENCY_CLOSE_MONTHS = 12;
export const GOAL_BUDGET_SURPLUS_SHARE = 0.6;

export interface RiskMix {
  /** Share of investable surplus directed to investments vs lifestyle headroom. */
  investShare: number;
  /** Maximum share of surplus reserved for guilt-free lifestyle spend. */
  lifestyleCapShare: number;
}

/**
 * Risk-profile-driven allocation mix. Used by both the blueprint waterfall and
 * the projection engine's "current route" so the two features never disagree
 * about how a given user invests today.
 */
export const RISK_MIX: Record<RiskProfile, RiskMix> = {
  conservative: { investShare: 0.55, lifestyleCapShare: 0.2 },
  balanced: { investShare: 0.65, lifestyleCapShare: 0.18 },
  aggressive: { investShare: 0.75, lifestyleCapShare: 0.15 },
};

export function riskMix(profile: RiskProfile): RiskMix {
  return RISK_MIX[profile] ?? RISK_MIX.balanced;
}

/**
 * Monthly ESSENTIAL spending — the single source of truth for emergency-fund
 * sizing and any "months of runway" math across the engine.
 *
 * The product collects an essential/discretionary flag per expense, but the
 * `totalExpensesPaise` aggregate lumps both together. Sizing an emergency fund
 * (or scoring runway) off total spend overstates the buffer a user truly needs
 * in a crisis — in a job loss you cut discretionary spend first. We therefore
 * sum only essential line items, falling back to total expenses when no line
 * items are available (e.g. a profile loaded as aggregates only).
 */
export function essentialMonthlyPaise(context: AIContext): number {
  const essential = context.expenses
    .filter((e) => e.isEssential)
    .reduce((s, e) => s + e.amountPaise, 0);
  if (essential > 0) return essential;
  return Math.max(0, context.financials.totalExpensesPaise);
}
