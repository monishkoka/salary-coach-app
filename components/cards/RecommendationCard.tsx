import { View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import type { Recommendation } from '@/types';
import { palette } from '@/constants/theme';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: () => void;
  onDismiss?: () => void;
  done?: boolean;
}

const CATEGORY_ICON: Record<string, string> = {
  debt: '💳',
  emergency: '🛟',
  investment: '📈',
  tax: '🧾',
  savings: '🏦',
  spending_limit: '✂️',
  goal: '🎯',
  insurance: '🛡️',
  behavior: '🧠',
};

export function RecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  done,
}: RecommendationCardProps) {
  return (
    <Card>
      <View className="flex-row items-start">
        <ThemedText className="mr-2 text-xl">
          {CATEGORY_ICON[recommendation.category] ?? '✅'}
        </ThemedText>
        <View className="flex-1">
          <ThemedText variant="body" className="font-semibold">
            {recommendation.title}
          </ThemedText>
          <ThemedText variant="caption" tone="secondary" className="mt-1">
            {recommendation.body}
          </ThemedText>
        </View>
      </View>
      {done ? (
        <View className="mt-3 flex-row items-center">
          <ThemedText variant="label" style={{ color: palette.positive }}>
            ✓ Done
          </ThemedText>
        </View>
      ) : (
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button label="Do it" onPress={() => onAccept?.()} />
          </View>
          <View className="flex-1">
            <Button label="Dismiss" variant="ghost" onPress={() => onDismiss?.()} />
          </View>
        </View>
      )}
    </Card>
  );
}
