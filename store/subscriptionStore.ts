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
    await AsyncStorage.setItem(TIER_KEY, tier);
    set({ tier, entitlements: entitlementsFor(tier) });
    analytics.track('subscribe_started', { tier });
  },

  can: (feature) => get().entitlements.features[feature],
}));
