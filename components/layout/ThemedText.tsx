import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

type Variant = 'hero' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'inverse';

const VARIANT_CLASS: Record<Variant, string> = {
  hero: 'text-5xl font-bold tracking-tight',
  title: 'text-3xl font-bold tracking-tight',
  heading: 'text-xl font-semibold',
  body: 'text-base',
  label: 'text-sm font-medium',
  caption: 'text-xs',
};

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  className?: string;
}

export function ThemedText({
  variant = 'body',
  tone = 'primary',
  className,
  style,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const color =
    tone === 'secondary'
      ? colors.textSecondary
      : tone === 'tertiary'
        ? colors.textTertiary
        : tone === 'accent'
          ? colors.accent
          : tone === 'inverse'
            ? colors.surface
            : colors.textPrimary;

  return (
    <Text
      className={cn(VARIANT_CLASS[variant], className)}
      style={[{ color }, style]}
      {...rest}
    />
  );
}
