import { type ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { shadow } from '@/constants/theme';
import { cn } from '@/utils/cn';

interface CardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  /** Slightly raised alternate surface (used inside other cards). */
  inset?: boolean;
  /** Drop the soft shadow (e.g. nested cards). */
  flat?: boolean;
  /** Screen-reader label for the tappable card (when onPress is set). */
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  className,
  inset,
  flat,
  style,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const { colors, isDark } = useTheme();
  const elevate = !inset && !flat;
  const body = (
    <View
      className={cn('rounded-card p-5', className)}
      style={[
        {
          backgroundColor: inset ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        },
        elevate ? shadow(isDark).card : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {body}
    </Pressable>
  );
}
