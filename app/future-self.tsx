import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ThemedText } from '@/components/layout/ThemedText';
import { Card } from '@/components/cards/Card';
import { ProjectionChart } from '@/components/charts/ProjectionChart';
import { PaywallNotice } from '@/components/billing/PaywallNotice';
import { LoadingState } from '@/components/layout/States';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';
import { useProfileStore } from '@/store/profileStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { formatINRCompact } from '@/utils/currency';
import { analytics } from '@/services/analytics';
import type { ScenarioId } from '@/types';

type FixedHorizon = 'y1' | 'y3' | 'y5' | 'y10' | 'y15';
type HorizonKey = FixedHorizon | 'retirement';

const HORIZONS: { key: FixedHorizon; month: number; label: string }[] = [
  { key: 'y1', month: 12, label: '1 yr' },
  { key: 'y3', month: 36, label: '3 yr' },
  { key: 'y5', month: 60, label: '5 yr' },
  { key: 'y10', month: 120, label: '10 yr' },
  { key: 'y15', month: 180, label: '15 yr' },
];

export default function FutureSelfScreen() {
  const loaded = useProfileStore((s) => s.loaded);
  const plan = useFinancialPlan();
  const can = useSubscriptionStore((s) => s.can);
  const haptics = useHaptics();
  const { colors } = useTheme();
  const unlocked = can('future_self');

  const [scenarioId, setScenarioId] = useState<ScenarioId>('save_more');
  const [horizonKey, setHorizonKey] = useState<HorizonKey>('y10');

  useEffect(() => {
    analytics.track('future_self_simulated');
  }, []);

  const current = plan?.scenarios.find((s) => s.id === 'current');
  const selected = plan?.scenarios.find((s) => s.id === scenarioId) ?? current;

  const horizonMonth =
    horizonKey === 'retirement'
      ? (selected?.retirementMonth ?? 240)
      : HORIZONS.find((h) => h.key === horizonKey)!.month;
  const selectedAtHorizon = useMemo(
    () => selected?.points.find((p) => p.month === horizonMonth),
    [selected, horizonMonth],
  );
  // Labels derived from the actual sampled points so the chart stays correct as
  // horizons (incl. dynamic retirement) change.
  const chartLabels = useMemo(
    () => (selected?.points ?? []).map((p) => (p.month === 0 ? 'Now' : `${Math.round(p.month / 12)}y`)),
    [selected],
  );

  if (!loaded || !plan || !current || !selected) return <LoadingState label="Modeling your future…" />;

  const retireYears = Math.round(selected.retirementMonth / 12);

  return (
    <Screen contentClassName="px-5 pb-16">
      <ScreenHeader title="Future Self Simulator" subtitle="See where each decision takes you" />

      {/* Scenario chips */}
      <View className="mt-2 flex-row flex-wrap gap-2">
        {plan.scenarios.map((s) => {
          const active = s.id === scenarioId;
          const locked = !unlocked && s.id !== 'current' && s.id !== 'save_more';
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                if (locked) return;
                haptics.light();
                setScenarioId(s.id);
                analytics.track('scenario_compared', { scenario: s.id });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: locked }}
              accessibilityLabel={locked ? `${s.label} (locked, upgrade to unlock)` : s.label}
              className="rounded-pill px-3.5 py-2"
              style={{
                backgroundColor: active ? colors.accent : colors.surfaceAlt,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                opacity: locked ? 0.5 : 1,
              }}
            >
              <ThemedText
                variant="caption"
                className="font-semibold"
                style={{ color: active ? '#FFFFFF' : colors.textPrimary }}
              >
                {locked ? '🔒 ' : ''}
                {s.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText variant="caption" tone="secondary" className="mt-2">
        {selected.description}
      </ThemedText>

      {/* Projection chart: selected vs current */}
      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <ThemedText variant="caption" tone="secondary">
            Net worth projection
          </ThemedText>
          <View className="flex-row items-center gap-3">
            <Legend color={colors.accent} label={selected.label} />
            <Legend color={colors.textTertiary} label="Current" />
          </View>
        </View>
        <View className="mt-2">
          <ProjectionChart
            labels={chartLabels}
            primary={{ label: selected.label, points: selected.points.map((p) => p.netWorthPaise) }}
            comparison={
              scenarioId === 'current'
                ? undefined
                : { label: 'Current', points: current.points.map((p) => p.netWorthPaise) }
            }
            height={210}
          />
        </View>
      </Card>

      {/* Horizon selector */}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {HORIZONS.map((h) => {
          const active = h.key === horizonKey;
          return (
            <Pressable
              key={h.key}
              onPress={() => {
                haptics.light();
                setHorizonKey(h.key);
              }}
              className="items-center rounded-2xl px-3.5 py-2"
              style={{ backgroundColor: active ? colors.accentSoft : colors.surfaceAlt }}
            >
              <ThemedText variant="caption" className="font-semibold" style={{ color: active ? colors.accent : colors.textSecondary }}>
                {h.label}
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            haptics.light();
            setHorizonKey('retirement');
          }}
          className="items-center rounded-2xl px-3.5 py-2"
          style={{ backgroundColor: horizonKey === 'retirement' ? colors.accentSoft : colors.surfaceAlt }}
        >
          <ThemedText
            variant="caption"
            className="font-semibold"
            style={{ color: horizonKey === 'retirement' ? colors.accent : colors.textSecondary }}
          >
            Retire
          </ThemedText>
        </Pressable>
      </View>

      {/* Forecast breakdown at selected horizon */}
      <View className="mt-4 flex-row gap-3">
        <Forecast label="Net Worth" value={formatINRCompact(selectedAtHorizon?.netWorthPaise ?? 0)} />
        <Forecast label="Investments" value={formatINRCompact(selectedAtHorizon?.investmentsPaise ?? 0)} />
        <Forecast label="Savings" value={formatINRCompact(selectedAtHorizon?.savingsPaise ?? 0)} />
      </View>

      {/* Retirement corpus */}
      <Card className="mt-4" flat inset>
        <ThemedText variant="caption" tone="tertiary" className="uppercase">
          Projected retirement corpus
        </ThemedText>
        <View className="mt-1 flex-row items-baseline gap-2">
          <ThemedText variant="title">{formatINRCompact(selected.retirementCorpusPaise)}</ThemedText>
          <ThemedText variant="caption" tone="secondary">
            in ~{retireYears} yrs ({selected.label})
          </ThemedText>
        </View>
      </Card>

      {/* Uplift callout */}
      {scenarioId !== 'current' && selected.upliftVsCurrentPaise > 0 ? (
        <Card className="mt-4" style={{ borderColor: colors.positive, borderWidth: 1.5 }}>
          <ThemedText variant="body" className="font-semibold" style={{ color: colors.positive }}>
            +{formatINRCompact(selected.upliftVsCurrentPaise)} richer in 10 years
          </ThemedText>
          <ThemedText variant="caption" tone="secondary" className="mt-1">
            That’s how much more you’d have versus your current path — and {selected.goalsAchievable} of your goals become reachable within 10 years.
          </ThemedText>
        </Card>
      ) : null}

      {!unlocked ? (
        <View className="mt-4">
          <PaywallNotice
            feature="future_self_scenarios"
            title="Unlock every scenario"
            body="Compare aggressive investing, lifestyle changes and more — with unlimited side-by-side projections."
            plan="pro"
          />
        </View>
      ) : null}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <ThemedText variant="caption" tone="tertiary">
        {label}
      </ThemedText>
    </View>
  );
}

function Forecast({ label, value }: { label: string; value: string }) {
  return (
    <Card flat inset className="flex-1 items-center p-3">
      <ThemedText variant="caption" tone="tertiary" className="uppercase">
        {label}
      </ThemedText>
      <ThemedText variant="heading" className="mt-1">
        {value}
      </ThemedText>
    </Card>
  );
}
