import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface Option<T> {
  label: string;
  value: T;
  description?: string;
}

interface OptionGroupProps<T> {
  options: Option<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}

/** Vertically stacked single-select option list (risk quiz, choices). */
export function OptionGroup<T extends string | number>({
  options,
  selected,
  onSelect,
}: OptionGroupProps<T>) {
  const { colors } = useTheme();
  const haptics = useHaptics();

  return (
    <View className="gap-3">
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              haptics.light();
              onSelect(opt.value);
            }}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: active ? colors.accentSoft : colors.surface,
              borderWidth: 1.5,
              borderColor: active ? colors.accent : colors.border,
            }}
          >
            <ThemedText
              variant="body"
              className="font-medium"
              style={active ? { color: colors.accent } : undefined}
            >
              {opt.label}
            </ThemedText>
            {opt.description ? (
              <ThemedText variant="caption" tone="secondary" className="mt-1">
                {opt.description}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
