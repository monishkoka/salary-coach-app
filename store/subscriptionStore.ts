import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Entitlements, Feature, SubscriptionTier } from '@/types';
import { entitlementsFor } from '@/services/billing/entitlements';
import { analytics } from '@/services/analytics';
import { config } from '@/constants/config';

const TIER_KEY = 'sc:subscription-tier';

interface SubscriptionState {
  tier: SubscriptionTier;
  entitlements: Entitlements;
  hydrate: () => Promise<void>;
  /** Local entitlement switch (real purchase flow plugs in here later). */
  setTier: (tier: SubscriptionTier) => Promise<void>;
  can: (feature: Feature) => boolean;
  /** Clear the persisted tier and fall back to Free (called on sign-out). */
  reset: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  entitlements: entitlementsFor('free'),

  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(TIER_KEY)) as SubscriptionTier | null;
    // Demo/mock mode showcases the full product on Pro; the Profile tier switcher
    // lets you downgrade to Free to see the paywalls in action.
    const tier = stored ?? (config.useMockData ? 'pro' : 'free');
    set({ tier, entitlements: entitlementsFor(tier) });
  },

  setTier: async (tier) => {
    const previous = get().tier;
    await AsyncStorage.setItem(TIER_KEY, tier);
    set({ tier, entitlements: entitlementsFor(tier) });
    // Only fire the conversion event on a genuine upgrade to a paid tier — not on
    // downgrades or lateral switches (which would pollute the conversion funnel).
    const RANK: Record<string, number> = { free: 0, pro: 1, premium: 2, enterprise: 3 };
    if (tier !== 'free' && (RANK[tier] ?? 0) > (RANK[previous] ?? 0)) {
      analytics.track('subscribe_completed', { tier, from: previous });
    }
  },

  can: (feature) => get().entitlements.features[feature],

  reset: async () => {
    try {
      await AsyncStorage.removeItem(TIER_KEY);
    } catch {
      // best effort
    }
    set({ tier: 'free', entitlements: entitlementsFor('free') });
  },
}));
