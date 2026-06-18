import { Pressable, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <View className={`mb-3 mt-6 flex-row items-center justify-between ${className ?? ''}`}>
      <ThemedText variant="heading">{title}</ThemedText>
      {action ? (
        <Pressable onPress={action.onPress}>
          <ThemedText variant="label" tone="accent">
            {action.label}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
