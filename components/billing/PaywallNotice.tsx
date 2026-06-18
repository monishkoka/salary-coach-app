import { useEffect } from 'react';
import { View } from 'react-native';
import { Card } from '@/components/cards/Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PLAN_INFO } from '@/services/billing/entitlements';
import { analytics } from '@/services/analytics';

interface PaywallNoticeProps {
  feature: string;
  title: string;
  body: string;
  /** Which paid plan unlocks this (defaults to Pro). */
  plan?: 'pro' | 'premium';
}

/**
 * Soft paywall surfaced at an "aha" moment. Shows the value, names the plan,
 * and (in this build) unlocks instantly via the local entitlement switch so the
 * upgrade flow can be demoed end-to-end before StoreKit is wired.
 */
export function PaywallNotice({ feature, title, body, plan = 'pro' }: PaywallNoticeProps) {
  const setTier = useSubscriptionStore((s) => s.setTier);
  const info = PLAN_INFO[plan];

  useEffect(() => {
    analytics.track('paywall_viewed', { feature, plan });
    analytics.track('feature_locked_hit', { feature });
  }, [feature, plan]);

  return (
    <Card className="items-center">
      <ThemedText className="text-3xl">🔒</ThemedText>
      <ThemedText variant="heading" className="mt-2 text-center">
        {title}
      </ThemedText>
      <ThemedText variant="body" tone="secondary" className="mt-1 text-center">
        {body}
      </ThemedText>

      <View className="mt-4 w-full rounded-card p-4" style={{ backgroundColor: 'transparent' }}>
        {info.highlights.map((h) => (
          <View key={h} className="flex-row items-center gap-2 py-1">
            <ThemedText tone="accent">✓</ThemedText>
            <ThemedText variant="caption" tone="secondary">
              {h}
            </ThemedText>
          </View>
        ))}
      </View>

      <Button
        label={`Unlock with ${info.name} · ${info.priceLabel}`}
        onPress={() => setTier(plan)}
        className="mt-2"
      />
      <ThemedText variant="caption" tone="tertiary" className="mt-2 text-center">
        7-day free trial · cancel anytime
      </ThemedText>
    </Card>
  );
}
