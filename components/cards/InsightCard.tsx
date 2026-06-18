import { View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { TrendChart } from '@/components/charts/TrendChart';
import type { Insight } from '@/types';
import { palette } from '@/constants/theme';

interface InsightCardProps {
  insight: Insight;
}

const THEME_ICON: Record<Insight['theme'], string> = {
  spending: '🧾',
  savings: '🏦',
  salary: '💼',
  wealth: '📊',
  behavior: '🧠',
  forecast: '🔮',
};

export function InsightCard({ insight }: InsightCardProps) {
  const accent =
    insight.sentiment === 1
      ? palette.positive
      : insight.sentiment === -1
        ? palette.risk
        : palette.ink[400];

  return (
    <Card>
      <View className="flex-row items-center">
        <ThemedText className="mr-2 text-lg">{THEME_ICON[insight.theme]}</ThemedText>
        <View className="flex-1">
          <ThemedText variant="body" className="font-semibold" style={{ color: accent }}>
            {insight.headline}
          </ThemedText>
        </View>
      </View>
      <ThemedText variant="caption" tone="secondary" className="mt-2">
        {insight.body}
      </ThemedText>
      {insight.series && insight.series.length > 1 ? (
        <View className="mt-3">
          <TrendChart data={insight.series} color={accent} />
        </View>
      ) : null}
    </Card>
  );
}
