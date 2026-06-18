import { View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, sublabel, icon, trend }: StatCardProps) {
  return (
    <Card className="flex-1 p-4">
      <View className="flex-row items-center justify-between">
        <ThemedText variant="caption" tone="secondary" className="uppercase tracking-wide">
          {label}
        </ThemedText>
        {icon ? <ThemedText className="text-base">{icon}</ThemedText> : null}
      </View>
      <ThemedText variant="heading" className="mt-2">
        {value}
      </ThemedText>
      {sublabel ? (
        <ThemedText variant="caption" tone="tertiary" className="mt-0.5">
          {sublabel}
        </ThemedText>
      ) : null}
      {trend ? (
        <ThemedText
          variant="caption"
          className="mt-1"
          style={{ color: trend.positive ? '#1FB57A' : '#E5645B' }}
        >
          {trend.positive ? '▲' : '▼'} {trend.value}
        </ThemedText>
      ) : null}
    </Card>
  );
}
