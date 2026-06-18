import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ThemedText } from '@/components/layout/ThemedText';
import { Card } from '@/components/cards/Card';
import { GpsRouteCard } from '@/components/cards/GpsRouteCard';
import { PaywallNotice } from '@/components/billing/PaywallNotice';
import { LoadingState } from '@/components/layout/States';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';
import { useProfileStore } from '@/store/profileStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/services/analytics';
import type { RouteKind } from '@/types';

const EMPHASIS: Record<RouteKind, 'current' | 'recommended'> = {
  current: 'current',
  recommended: 'recommended',
  aggressive: 'recommended',
  safe: 'current',
};

export default function MoneyGpsScreen() {
  const loaded = useProfileStore((s) => s.loaded);
  const plan = useFinancialPlan();
  const can = useSubscriptionStore((s) => s.can);
  const { colors } = useTheme();
  const unlocked = can('money_gps');

  useEffect(() => {
    analytics.track('money_gps_viewed');
  }, []);

  if (!loaded || !plan) return <LoadingState label="Plotting your route…" />;

  const { current, routes, correction, trust } = plan.moneyGps;
  // Free users see only the current path; the optimized routes are gated.
  const visibleRoutes = unlocked ? routes : [current];

  return (
    <Screen contentClassName="px-5 pb-16">
      <ScreenHeader title="Money GPS" subtitle="Four routes to your future — pick your speed" />

      <Card className="mt-2" flat inset>
        <View className="flex-row items-center gap-2">
          <ThemedText className="text-lg">🧭</ThemedText>
          <ThemedText variant="label" className="font-semibold">
            Route correction
          </ThemedText>
        </View>
        <ThemedText variant="body" tone="secondary" className="mt-1">
          {correction}
        </ThemedText>
      </Card>

      {/* Route grid (2 per row). */}
      <View className="mt-4 gap-3">
        {chunk(visibleRoutes, 2).map((pair, i) => (
          <View key={i} className="flex-row gap-3">
            {pair.map((r) => (
              <GpsRouteCard key={r.kind} title={r.label} route={r} emphasis={EMPHASIS[r.kind]} />
            ))}
            {pair.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
      </View>

      {/* Trust: why the recommended route. */}
      {unlocked ? (
        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <ThemedText variant="label" className="font-semibold">
              Why we recommend this
            </ThemedText>
            <View className="rounded-pill px-2.5 py-1" style={{ backgroundColor: colors.accentSoft }}>
              <ThemedText variant="caption" className="font-bold" style={{ color: colors.accent }}>
                {trust.confidence}% confident
              </ThemedText>
            </View>
          </View>
          {trust.reasoning.map((r, i) => (
            <ThemedText key={`reason-${i}`} variant="caption" tone="secondary" className="mt-1.5">
              • {r}
            </ThemedText>
          ))}
          <View className="my-3 h-px" style={{ backgroundColor: colors.border }} />
          <ThemedText variant="caption" tone="tertiary" className="uppercase">
            Assumptions
          </ThemedText>
          {trust.assumptions.map((a, i) => (
            <ThemedText key={`assume-${i}`} variant="caption" tone="secondary" className="mt-1">
              • {a}
            </ThemedText>
          ))}
          <ThemedText variant="caption" tone="tertiary" className="mt-3 uppercase">
            Risks
          </ThemedText>
          {trust.risks.map((rk, i) => (
            <ThemedText key={`risk-${i}`} variant="caption" tone="secondary" className="mt-1">
              • {rk}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {!unlocked ? (
        <View className="mt-3">
          <PaywallNotice
            feature="money_gps_recommended"
            title="Unlock all four routes"
            body="See your Recommended, Aggressive and Safe routes side by side — plus the reasoning, confidence and risks behind each one."
            plan="pro"
          />
        </View>
      ) : null}

      <Card className="mt-4" onPress={() => router.push('/(tabs)/coach')}>
        <ThemedText variant="body" className="font-semibold">
          Ask your coach to re-route
        </ThemedText>
        <ThemedText variant="caption" tone="secondary" className="mt-1">
          “What’s the fastest way to bring my home goal forward?” · “How do I get to a strong retirement?”
        </ThemedText>
        <ThemedText variant="caption" tone="accent" className="mt-2" style={{ color: colors.accent }}>
          Open Coach →
        </ThemedText>
      </Card>
    </Screen>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
