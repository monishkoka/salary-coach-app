import { View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { GpsRoute, RetirementReadiness } from '@/types';
import { formatINRCompact } from '@/utils/currency';

interface GpsRouteCardProps {
  title: string;
  route: GpsRoute;
  /** "recommended" tints the card with the brand accent. */
  emphasis?: 'current' | 'recommended';
}

const READINESS_LABEL: Record<RetirementReadiness, string> = {
  weak: 'Needs work',
  moderate: 'Moderate',
  strong: 'Strong',
};

function formatMonths(months: number): string {
  if (months >= 600) return '50+ yrs';
  if (months < 12) return `${months} mo`;
  const yrs = Math.round((months / 12) * 10) / 10;
  return `${yrs} yrs`;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <ThemedText variant="caption" tone="secondary">
        {label}
      </ThemedText>
      <ThemedText variant="body" className="font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

export function GpsRouteCard({ title, route, emphasis = 'current' }: GpsRouteCardProps) {
  const { colors } = useTheme();
  const isRec = emphasis === 'recommended';
  const accent = isRec ? colors.accent : colors.textTertiary;

  return (
    <Card
      className="flex-1"
      style={isRec ? { borderColor: colors.accent, borderWidth: 1.5 } : undefined}
    >
      <View className="flex-row items-center gap-2">
        <View className="rounded-pill px-2.5 py-1" style={{ backgroundColor: isRec ? colors.accentSoft : colors.surfaceAlt }}>
          <ThemedText variant="caption" className="font-bold uppercase tracking-wider" style={{ color: accent }}>
            {title}
          </ThemedText>
        </View>
      </View>

      <View className="mt-3">
        <Row
          label="Emergency fund"
          value={route.emergencyMonths == null ? 'Funded ✓' : `${route.emergencyMonths} mo`}
          accent={isRec ? colors.accent : undefined}
        />
        {route.goalEtas.slice(0, 3).map((g) => (
          <Row key={g.goalId} label={`${g.icon ?? '🎯'} ${g.name}`} value={formatMonths(g.months)} />
        ))}
        <Row label="Retirement" value={READINESS_LABEL[route.retirement]} />
        <View className="my-2 h-px" style={{ backgroundColor: colors.border }} />
        <Row label="Net worth (10 yr)" value={formatINRCompact(route.netWorth10yPaise)} accent={isRec ? colors.accent : undefined} />
      </View>
    </Card>
  );
}
