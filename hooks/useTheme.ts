import { useThemeStore } from '@/store/themeStore';
import type { ThemeColors } from '@/constants/theme';

/** Convenience hook returning the active theme colors + dark flag. */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  return { colors, isDark };
}
