import { View } from 'react-native';
import { Card } from './Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { ThemedText } from '@/components/layout/ThemedText';
import type { Goal } from '@/types';
import { formatINRCompact } from '@/utils/currency';
import { formatMonthYear } from '@/utils/date';
import { pct } from '@/utils/finance';
import { palette } from '@/constants/theme';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

const STATUS_LABEL: Record<Goal['status'], { text: string; color: string }> = {
  on_track: { text: 'On track', color: palette.positive },
  at_risk: { text: 'At risk', color: palette.caution },
  achieved: { text: 'Achieved', color: palette.brand[500] },
  paused: { text: 'Paused', color: palette.ink[400] },
};

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const progress = pct(goal.currentAmountPaise, goal.targetAmountPaise);
  const status = STATUS_LABEL[goal.status];

  return (
    <Card onPress={onPress} className="flex-row items-center">
      <ProgressRing
        progress={progress}
        color={status.color}
        centerLabel={`${Math.round(progress)}%`}
      />
      <View className="ml-4 flex-1">
        <View className="flex-row items-center justify-between">
          <ThemedText variant="heading" className="text-lg">
            {goal.icon ? `${goal.icon} ` : ''}
            {goal.name}
          </ThemedText>
        </View>
        <ThemedText variant="body" tone="secondary" className="mt-0.5">
          {formatINRCompact(goal.currentAmountPaise)} of {formatINRCompact(goal.targetAmountPaise)}
        </ThemedText>
        <View className="mt-1 flex-row items-center justify-between">
          <ThemedText variant="caption" style={{ color: status.color }}>
            {status.text}
          </ThemedText>
          {goal.targetDate ? (
            <ThemedText variant="caption" tone="tertiary">
              by {formatMonthYear(goal.targetDate)}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
