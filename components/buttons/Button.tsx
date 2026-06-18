import { ActivityIndicator, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { ThemedText } from '@/components/layout/ThemedText';
import { palette, shadow } from '@/constants/theme';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  className,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const isDisabled = disabled || loading;
  const isFilled = variant === 'primary' || variant === 'danger';

  const solidBg =
    variant === 'secondary' ? colors.surfaceAlt : variant === 'ghost' ? 'transparent' : colors.accent;
  const textTone = isFilled ? 'inverse' : 'primary';

  const content = loading ? (
    <ActivityIndicator color={isFilled ? '#FFFFFF' : colors.accent} />
  ) : (
    <View className="flex-row items-center">
      <ThemedText
        variant="label"
        tone={textTone}
        className="text-base font-semibold"
        style={isFilled ? { color: '#FFFFFF' } : undefined}
      >
        {label}
      </ThemedText>
    </View>
  );

  // Primary uses a teal gradient + accent glow for a premium feel.
  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        className={cn('active:opacity-90', fullWidth && 'w-full', className)}
        style={[{ opacity: isDisabled ? 0.5 : 1 }, isDisabled ? null : shadow(isDark).accent]}
      >
        <LinearGradient
          colors={[palette.brand[400], palette.brand[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-14 items-center justify-center rounded-pill px-6"
          style={{ borderRadius: 999 }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      className={cn(
        'h-14 items-center justify-center rounded-pill px-6 active:opacity-80',
        fullWidth && 'w-full',
        className,
      )}
      style={{
        backgroundColor: solidBg,
        opacity: isDisabled ? 0.45 : 1,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      {content}
    </Pressable>
  );
}
