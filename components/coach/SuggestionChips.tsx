import { Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface SuggestionChipsProps {
  prompts: readonly string[];
  onPick: (prompt: string) => void;
}

export function SuggestionChips({ prompts, onPick }: SuggestionChipsProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-2"
    >
      {prompts.map((p) => (
        <Pressable
          key={p}
          onPress={() => {
            haptics.selection();
            onPick(p);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Ask: ${p}`}
          className="rounded-pill px-4 py-2.5"
          style={{ backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }}
        >
          <ThemedText variant="caption" style={{ color: colors.accent }}>
            {p}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
