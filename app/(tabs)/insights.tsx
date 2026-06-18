import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { InsightCard } from '@/components/cards/InsightCard';
import { Card } from '@/components/cards/Card';
import { LoadingState } from '@/components/layout/States';
import { useProfileStore } from '@/store/profileStore';
import { useMemoryStore } from '@/store/memoryStore';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';
import { explainHealth, healthImprovementPlan } from '@/services/engine';
import { useTheme } from '@/hooks/useTheme';
import { colorForScore } from '@/constants/theme';
import { analytics } from '@/services/analytics';
import type { InsightTheme } from '@/types';

const FILTERS: { key: InsightTheme | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'savings', label: 'Savings' },
  { key: 'wealth', label: 'Wealth' },
  { key: 'behavior', label: 'Behavior' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'salary', label: 'Salary' },
];

export default function Insights() {
  const { colors } = useTheme();
  const scores = useProfileStore((s) => s.scores);
  const loaded = useProfileStore((s) => s.loaded);
  const snapshots = useMemoryStore((s) => s.snapshots);
  const buildNarrative = useMemoryStore((s) => s.narrative);
  const plan = useFinancialPlan();
  const [filter, setFilter] = useState<InsightTheme | 'all'>('all');

  useEffect(() => {
    analytics.track('health_breakdown_viewed');
  }, []);

  if (!loaded || !plan) return <LoadingState label="Analyzing your money…" />;

  const insights = plan.insights.filter((i) => filter === 'all' || i.theme === filter);
  const sub = scores?.healthSubScores;
  const improvement = sub ? healthImprovementPlan(sub) : null;
  // Recompute whenever snapshots change (selector subscribes us to updates).
  const memory = snapshots.length ? buildNarrative() : null;
  const trendAccent =
    memory?.trend === 'improving'
      ? colors.positive
      : memory?.trend === 'slipping'
        ? colors.risk
        : colors.textSecondary;
  const trendEmoji = memory?.trend === 'improving' ? '📈' : memory?.trend === 'slipping' ? '📉' : '➡️';

  return (
    <Screen>
      <ThemedText variant="title" className="mt-2">
        Insights
      </ThemedText>
      <ThemedText variant="body" tone="secondary" className="mt-1">
        Patterns, forecasts, and what to do about them.
      </ThemedText>

      {/* Money Memory: longitudinal narrative the coach remembers */}
      {memory ? (
        <Card className="mt-5" style={{ borderColor: trendAccent, borderWidth: 1.5 }}>
          <View className="flex-row items-center gap-2">
            <ThemedText className="text-base">{trendEmoji}</ThemedText>
            <ThemedText variant="caption" tone="tertiary" className="uppercase tracking-wider">
              Your money memory · last {Math.max(1, memory.spanMonths)} mo
            </ThemedText>
          </View>
          <ThemedText variant="heading" className="mt-1.5" style={{ color: trendAccent }}>
            {memory.headline}
          </ThemedText>
          {memory.details.map((d, i) => (
            <ThemedText key={i} variant="caption" tone="secondary" className="mt-1.5">
              • {d}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      {/* Financial Health Engine: five named drivers */}
      {sub ? (
        <Card className="mt-5">
          <View className="flex-row items-center justify-between">
            <ThemedText variant="heading">Financial Health Engine</ThemedText>
            <ThemedText variant="title" style={{ color: colorForScore(scores?.healthScore ?? 0) }}>
              {scores?.healthScore ?? 0}
            </ThemedText>
          </View>
          <ThemedText variant="caption" tone="secondary" className="mb-3">
            Five drivers combine into your overall score.
          </ThemedText>
          {explainHealth(sub).map((row) => (
            <View key={row.label} className="mb-3">
              <View className="flex-row items-center justify-between">
                <ThemedText variant="label">{row.label}</ThemedText>
                <ThemedText variant="label" style={{ color: colorForScore(row.score) }}>
                  {row.score}
                </ThemedText>
              </View>
              <View className="mt-1.5 h-2 overflow-hidden rounded-pill" style={{ backgroundColor: colors.border }}>
                <View style={{ width: `${row.score}%`, height: '100%', backgroundColor: colorForScore(row.score) }} />
              </View>
              <ThemedText variant="caption" tone="tertiary" className="mt-1">
                {row.note}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Strengths / weaknesses + improvement plan */}
      {improvement ? (
        <Card className="mt-4" inset flat>
          {improvement.strengths.length ? (
            <ThemedText variant="caption" tone="secondary" className="mb-1">
              💪 Strengths: <ThemedText variant="caption" className="font-semibold">{improvement.strengths.join(', ')}</ThemedText>
            </ThemedText>
          ) : null}
          {improvement.weaknesses.length ? (
            <ThemedText variant="caption" tone="secondary" className="mb-2">
              🎯 Focus on: <ThemedText variant="caption" className="font-semibold">{improvement.weaknesses.join(', ')}</ThemedText>
            </ThemedText>
          ) : null}
          <ThemedText variant="label" className="mt-1 mb-1 font-semibold">
            Your improvement plan
          </ThemedText>
          {improvement.plan.map((step, i) => (
            <View key={i} className="flex-row gap-2 py-0.5">
              <ThemedText variant="caption" tone="accent">
                {i + 1}.
              </ThemedText>
              <ThemedText variant="caption" tone="secondary" className="flex-1">
                {step}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter insights by ${f.label}`}
              className="rounded-pill px-4 py-2"
              style={{
                backgroundColor: active ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <ThemedText variant="caption" style={{ color: active ? '#FFFFFF' : colors.textSecondary }}>
                {f.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Insight feed */}
      <View className="gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      <Card className="mt-6" onPress={() => router.push('/(tabs)/coach')}>
        <ThemedText variant="body" className="font-semibold">
          Want the story behind a number?
        </ThemedText>
        <ThemedText variant="caption" tone="secondary" className="mt-1">
          Ask your coach about any insight for a personalized breakdown.
        </ThemedText>
      </Card>
    </Screen>
  );
}
