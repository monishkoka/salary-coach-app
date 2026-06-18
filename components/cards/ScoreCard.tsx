import { View } from 'react-native';
import { Card } from './Card';
import { ScoreArc } from '@/components/charts/ScoreArc';
import { ThemedText } from '@/components/layout/ThemedText';

interface ScoreCardProps {
  title: string;
  score: number;
  caption: string;
  takeaway: string;
  onPress?: () => void;
}

export function ScoreCard({ title, score, caption, takeaway, onPress }: ScoreCardProps) {
  return (
    <Card onPress={onPress} className="items-center">
      <ThemedText variant="label" tone="secondary" className="self-start">
        {title}
      </ThemedText>
      <View className="my-2">
        <ScoreArc score={score} caption={caption} />
      </View>
      <ThemedText variant="body" tone="secondary" className="text-center">
        {takeaway}
      </ThemedText>
      {onPress ? (
        <ThemedText variant="caption" tone="accent" className="mt-2">
          See breakdown →
        </ThemedText>
      ) : null}
    </Card>
  );
}
