import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ThemedText } from '@/components/layout/ThemedText';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/buttons/Button';
import { AllocationBar, SEGMENT_COLOR } from '@/components/charts/AllocationBar';
import { LoadingState } from '@/components/layout/States';
import { palette } from '@/constants/theme';
import { useProfileStore } from '@/store/profileStore';
import { useBlueprintStore } from '@/store/blueprintStore';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { formatINR, formatINRCompact } from '@/utils/currency';
import { daysUntilDayOfMonth } from '@/utils/date';
import { analytics } from '@/services/analytics';

export default function PaydayScreen() {
  const loaded = useProfileStore((s) => s.loaded);
  const user = useProfileStore((s) => s.user);
  const financials = useProfileStore((s) => s.financials);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const generate = useBlueprintStore((s) => s.generate);
  const plan = useFinancialPlan();
  const haptics = useHaptics();
  const { colors } = useTheme();

  // Only treat this as the celebratory "salary just landed" moment when it
  // actually is payday — otherwise this screen is a calm plan review.
  const daysToPayday = user?.payDayOfMonth ? daysUntilDayOfMonth(user.payDayOfMonth) : null;
  const isPayday = daysToPayday === 0;

  useEffect(() => {
    if (loaded && !blueprint) generate();
  }, [loaded, blueprint, generate]);

  useEffect(() => {
    // Reserve the success "confetti" haptic for the genuine payday moment.
    if (isPayday) haptics.success();
    else haptics.light();
    analytics.track('payday_celebrated', { isPayday });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPayday]);

  if (!loaded || !financials || !blueprint) return <LoadingState label="Preparing your plan…" />;

  const lines = blueprint.allocations.filter((a) => a.amountPaise > 0);
  const projected = plan?.scenarios.find((s) => s.id === 'current')?.netWorthAt.y5 ?? 0;
  const projectedYear = new Date().getFullYear() + 5;

  const heroEyebrow = isPayday ? '🎉' : '🧭';
  const heroTitle = isPayday ? 'Salary received' : 'Your salary plan';
  const heroSub = isPayday
    ? "Here's exactly what to do with it"
    : daysToPayday != null
      ? `Payday in ${daysToPayday} ${daysToPayday === 1 ? 'day' : 'days'} — here's the plan`
      : "Here's how to put your salary to work";

  return (
    <Screen contentClassName="px-5 pb-16">
      <ScreenHeader title="" subtitle={undefined} onBack={() => router.back()} />

      <Animated.View entering={ZoomIn.duration(420)}>
        <LinearGradient
          colors={[palette.brand[600], palette.brand[400]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 24, alignItems: 'center' }}
        >
          <ThemedText className="text-5xl">{heroEyebrow}</ThemedText>
          <ThemedText variant="heading" style={{ color: '#FFFFFF' }} className="mt-2">
            {heroTitle}
          </ThemedText>
          <ThemedText variant="title" style={{ color: '#FFFFFF' }} className="mt-1">
            {formatINR(financials.monthlyIncomePaise)}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} className="mt-1">
            {heroSub}
          </ThemedText>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(250)}>
        <View className="mt-5">
          <AllocationBar allocations={lines} height={20} />
        </View>
      </Animated.View>

      <ThemedText variant="heading" className="mt-6 mb-1">
        This month’s plan
      </ThemedText>

      <View className="gap-3">
        {lines.map((line, i) => (
          <Animated.View key={line.key} entering={FadeInDown.delay(350 + i * 90).springify()}>
            <Card flat inset className="flex-row items-center">
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: SEGMENT_COLOR[line.key] }}
              />
              <View className="ml-3 flex-1">
                <ThemedText variant="body" className="font-semibold">
                  {line.label}
                </ThemedText>
                <ThemedText variant="caption" tone="tertiary">
                  {line.pct}% of salary
                </ThemedText>
              </View>
              <ThemedText variant="heading">{formatINRCompact(line.amountPaise)}</ThemedText>
            </Card>
          </Animated.View>
        ))}
      </View>

      {projected > 0 ? (
        <Animated.View entering={FadeInDown.delay(350 + lines.length * 90 + 100)}>
          <Card className="mt-5 items-center" style={{ borderColor: colors.accent, borderWidth: 1.5 }}>
            <ThemedText variant="caption" tone="secondary" className="uppercase tracking-wider">
              Predicted net worth
            </ThemedText>
            <ThemedText variant="title" tone="accent" className="mt-1">
              {formatINRCompact(projected)}
            </ThemedText>
            <ThemedText variant="caption" tone="tertiary" className="mt-1">
              by {projectedYear}, if you stick to this plan
            </ThemedText>
          </Card>
        </Animated.View>
      ) : null}

      <View className="mt-6 gap-3">
        <Button
          label={isPayday ? 'Lock in this plan' : 'Got it'}
          onPress={() => {
            haptics.success();
            router.replace('/(tabs)');
          }}
        />
        <Button label="Ask my coach first" variant="ghost" onPress={() => router.push('/(tabs)/coach')} />
      </View>
    </Screen>
  );
}
