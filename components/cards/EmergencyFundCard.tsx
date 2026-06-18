import { View } from 'react-native';
import { Card } from './Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { ThemedText } from '@/components/layout/ThemedText';
import { formatINRCompact } from '@/utils/currency';
import { palette } from '@/constants/theme';

interface EmergencyFundCardProps {
  currentPaise: number;
  monthlyEssentialPaise: number;
  targetMonths: number;
}

export function EmergencyFundCard({
  currentPaise,
  monthlyEssentialPaise,
  targetMonths,
}: EmergencyFundCardProps) {
  const monthsCovered = monthlyEssentialPaise > 0 ? currentPaise / monthlyEssentialPaise : 0;
  const progress = Math.min(100, (monthsCovered / targetMonths) * 100);
  const onTrack = progress >= 100;

  return (
    <Card className="flex-row items-center">
      <ProgressRing
        progress={progress}
        color={onTrack ? palette.brand[500] : palette.caution}
        centerLabel={`${monthsCovered.toFixed(1)}m`}
      />
      <View className="ml-4 flex-1">
        <ThemedText variant="heading" className="text-lg">
          🛟 Emergency Fund
        </ThemedText>
        <ThemedText variant="body" tone="secondary" className="mt-0.5">
          {formatINRCompact(currentPaise)} saved · {monthsCovered.toFixed(1)} of {targetMonths}{' '}
          months
        </ThemedText>
        <ThemedText
          variant="caption"
          className="mt-1"
          style={{ color: onTrack ? palette.brand[500] : palette.caution }}
        >
          {onTrack
            ? 'Fully funded — you’re protected.'
            : `Top up to reach ${targetMonths} months of safety.`}
        </ThemedText>
      </View>
    </Card>
  );
}
