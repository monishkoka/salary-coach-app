import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ThemedText } from '@/components/layout/ThemedText';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/buttons/Button';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PLAN_INFO } from '@/services/billing/entitlements';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/services/analytics';
import type { SubscriptionTier } from '@/types';

const PLANS: Exclude<SubscriptionTier, 'enterprise'>[] = ['free', 'pro', 'premium'];

export default function PaywallScreen() {
  const tier = useSubscriptionStore((s) => s.tier);
  const setTier = useSubscriptionStore((s) => s.setTier);
  const { colors } = useTheme();

  useEffect(() => {
    analytics.track('paywall_viewed', { source: 'paywall_screen' });
  }, []);

  return (
    <Screen contentClassName="px-5 pb-16">
      <ScreenHeader title="Choose your plan" subtitle="A personal CFO for less than ₹10/day" />

      <View className="mt-2 gap-4">
        {PLANS.map((p) => {
          const info = PLAN_INFO[p];
          const isCurrent = tier === p;
          const isPaid = p !== 'free';
          return (
            <Card
              key={p}
              style={isPaid ? { borderColor: colors.accent, borderWidth: isCurrent ? 2 : 1.5 } : undefined}
            >
              <View className="flex-row items-center justify-between">
                <ThemedText variant="heading">{info.name}</ThemedText>
                <ThemedText variant="heading" tone="accent">
                  {info.priceLabel}
                </ThemedText>
              </View>
              <ThemedText variant="caption" tone="secondary">
                {info.tagline}
              </ThemedText>
              <View className="mt-3 gap-1.5">
                {info.highlights.map((h) => (
                  <View key={h} className="flex-row items-center gap-2">
                    <ThemedText tone="accent">✓</ThemedText>
                    <ThemedText variant="caption" tone="secondary">
                      {h}
                    </ThemedText>
                  </View>
                ))}
              </View>
              <Button
                label={isCurrent ? 'Current plan' : isPaid ? `Start ${info.name}` : 'Switch to Free'}
                variant={isCurrent ? 'secondary' : isPaid ? 'primary' : 'ghost'}
                disabled={isCurrent}
                onPress={async () => {
                  if (isPaid) analytics.track('subscribe_started', { tier: p, source: 'paywall_screen' });
                  await setTier(p);
                  router.back();
                }}
                className="mt-4"
              />
            </Card>
          );
        })}
      </View>

      <ThemedText variant="caption" tone="tertiary" className="mt-4 text-center">
        Plans renew monthly. Cancel anytime. No data is ever sold.
      </ThemedText>
    </Screen>
  );
}
