import { View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface HighlightCardProps {
  variant: 'mistake' | 'opportunity';
  title: string;
  body: string;
  /** Quantified badge, e.g. "₹18.9K/yr lost" or "7 months sooner". */
  badge: string;
  onPress?: () => void;
}

/**
 * Mission-control highlight: the single biggest mistake (risk-toned) or biggest
 * opportunity (positive-toned). Designed to answer "what is wrong / what is the
 * best move" at a glance.
 */
export function HighlightCard({ variant, title, body, badge, onPress }: HighlightCardProps) {
  const { colors } = useTheme();
  const isMistake = variant === 'mistake';
  const accent = isMistake ? colors.risk : colors.positive;
  const icon = isMistake ? '⚠️' : '🚀';
  const eyebrow = isMistake ? 'BIGGEST MISTAKE' : 'BIGGEST OPPORTUNITY';

  return (
    <Card
      onPress={onPress}
      className="flex-1"
      style={{ borderColor: accent + '55', borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <View className="flex-row items-center gap-2">
        <ThemedText className="text-base">{icon}</ThemedText>
        <ThemedText variant="caption" className="font-bold tracking-widest" style={{ color: accent }}>
          {eyebrow}
        </ThemedText>
      </View>
      <ThemedText variant="body" className="mt-2 font-semibold">
        {title}
      </ThemedText>
      <ThemedText variant="caption" tone="secondary" className="mt-1">
        {body}
      </ThemedText>
      <View
        className="mt-3 self-start rounded-pill px-3 py-1"
        style={{ backgroundColor: accent + '1A' }}
      >
        <ThemedText variant="caption" className="font-semibold" style={{ color: accent }}>
          {badge}
        </ThemedText>
      </View>
    </Card>
  );
}
