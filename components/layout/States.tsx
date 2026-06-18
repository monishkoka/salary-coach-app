import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { Button } from '@/components/buttons/Button';
import { useTheme } from '@/hooks/useTheme';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator color={colors.accent} />
      <ThemedText variant="caption" tone="secondary" className="mt-3">
        {label}
      </ThemedText>
    </View>
  );
}

export function EmptyState({
  icon = '🌱',
  title,
  body,
  cta,
}: {
  icon?: string;
  title: string;
  body?: string;
  cta?: { label: string; onPress: () => void };
}) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <ThemedText className="mb-3 text-4xl">{icon}</ThemedText>
      <ThemedText variant="heading" className="text-center">
        {title}
      </ThemedText>
      {body ? (
        <ThemedText variant="body" tone="secondary" className="mt-2 text-center">
          {body}
        </ThemedText>
      ) : null}
      {cta ? (
        <View className="mt-6 w-full">
          <Button label={cta.label} onPress={cta.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <ThemedText className="mb-3 text-4xl">⚠️</ThemedText>
      <ThemedText variant="body" tone="secondary" className="text-center">
        {message}
      </ThemedText>
      {onRetry ? (
        <View className="mt-6 w-full">
          <Button label="Try again" variant="ghost" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
