/**
 * Subscription entitlements (pure, deterministic).
 *
 * Maps a subscription tier to the features it unlocks. This is the single source
 * of truth the app consults before showing a paywall. Actual billing (Apple IAP
 * via StoreKit 2) plugs in later behind `services/billing` — this layer stays
 * unchanged because gating is by entitlement, not by purchase mechanics.
 */

import type { Entitlements, Feature, SubscriptionTier } from '@/types';

const ALL_FEATURES: Feature[] = [
  'blueprint_full',
  'velocity_score',
  'money_gps',
  'future_self',
  'unlimited_coach',
  'unlimited_goals',
  'advanced_projections',
];

function features(enabled: Feature[]): Record<Feature, boolean> {
  return ALL_FEATURES.reduce(
    (acc, f) => {
      acc[f] = enabled.includes(f);
      return acc;
    },
    {} as Record<Feature, boolean>,
  );
}

const FREE: Entitlements = {
  tier: 'free',
  features: features([]),
  coachMessagesPerMonth: 5,
  maxActiveGoals: 1,
};

const PRO: Entitlements = {
  tier: 'pro',
  features: features([
    'blueprint_full',
    'velocity_score',
    'money_gps',
    'future_self',
    'unlimited_coach',
    'unlimited_goals',
  ]),
  coachMessagesPerMonth: Infinity,
  maxActiveGoals: Infinity,
};

const PREMIUM: Entitlements = {
  tier: 'premium',
  features: features(ALL_FEATURES),
  coachMessagesPerMonth: Infinity,
  maxActiveGoals: Infinity,
};

const ENTERPRISE: Entitlements = { ...PREMIUM, tier: 'enterprise' };

const TABLE: Record<SubscriptionTier, Entitlements> = {
  free: FREE,
  pro: PRO,
  premium: PREMIUM,
  enterprise: ENTERPRISE,
};

export function entitlementsFor(tier: SubscriptionTier): Entitlements {
  return TABLE[tier] ?? FREE;
}

/** Human-friendly plan metadata for the paywall. */
export const PLAN_INFO: Record<
  Exclude<SubscriptionTier, 'enterprise'>,
  { name: string; priceLabel: string; tagline: string; highlights: string[] }
> = {
  free: {
    name: 'Free',
    priceLabel: '₹0',
    tagline: 'Your first blueprint & score',
    highlights: ['Salary Blueprint (basic)', 'Financial Health Score', '1 active goal', '5 coach messages / mo'],
  },
  pro: {
    name: 'Pro',
    priceLabel: '₹299/mo',
    tagline: 'Your full personal CFO',
    highlights: ['Money GPS & Future Self', 'Wealth Velocity Score', 'Unlimited goals & coaching', 'Full blueprint + re-optimization'],
  },
  premium: {
    name: 'Premium',
    priceLabel: '₹599/mo',
    tagline: 'Advanced planning & forecasting',
    highlights: ['Everything in Pro', 'Advanced projections & FIRE modeling', 'Priority AI features', 'Scenario deep-dives'],
  },
};
