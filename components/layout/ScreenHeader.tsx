import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Defaults to router.back(). */
  onBack?: () => void;
  showBack?: boolean;
}

/** Lightweight header for full-screen (non-tab) routes: back chevron + title. */
export function ScreenHeader({ title, subtitle, onBack, showBack = true }: ScreenHeaderProps) {
  const { colors } = useTheme();
  return (
    <View className="mb-2 flex-row items-center gap-3">
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="rounded-pill"
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <ThemedText variant="heading">{title}</ThemedText>
        {subtitle ? (
          <ThemedText variant="caption" tone="secondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
