/**
 * Design tokens. NativeWind/Tailwind classes are the primary styling surface
 * (see tailwind.config.js), but charts and a few imperative APIs need raw
 * values — those live here so there is a single source of truth.
 */

export const palette = {
  brand: {
    50: '#E6F6F0',
    100: '#C2E9D9',
    200: '#8FD6BB',
    300: '#54BE98',
    400: '#2BA67E',
    500: '#0E8C6A',
    600: '#0A7257',
    700: '#085A45',
  },
  ink: {
    50: '#F7F7F5',
    100: '#ECECEA',
    200: '#D6D6D3',
    300: '#B3B3AF',
    400: '#86868B',
    500: '#5A5A60',
    600: '#3A3A40',
    700: '#26262B',
    800: '#17171B',
    900: '#0B0B0F',
  },
  positive: '#1FB57A',
  caution: '#E8A33D',
  risk: '#E5645B',
  white: '#FFFFFF',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  positive: string;
  caution: string;
  risk: string;
}

export const lightTheme: ThemeColors = {
  background: palette.ink[50],
  surface: palette.white,
  surfaceAlt: '#FFFFFF',
  border: palette.ink[100],
  textPrimary: palette.ink[900],
  textSecondary: palette.ink[500],
  textTertiary: palette.ink[400],
  accent: palette.brand[500],
  accentSoft: palette.brand[50],
  positive: palette.positive,
  caution: palette.caution,
  risk: palette.risk,
};

export const darkTheme: ThemeColors = {
  background: palette.ink[900],
  surface: palette.ink[800],
  surfaceAlt: palette.ink[700],
  border: palette.ink[700],
  textPrimary: palette.ink[50],
  textSecondary: palette.ink[300],
  textTertiary: palette.ink[400],
  accent: palette.brand[400],
  accentSoft: palette.brand[700],
  positive: palette.positive,
  caution: palette.caution,
  risk: palette.risk,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Soft iOS-style shadows. Pass `isDark` so we can dial down opacity on dark
 * backgrounds where heavy shadows look muddy.
 */
export function shadow(isDark: boolean) {
  return {
    sm: {
      shadowColor: '#0B0B0F',
      shadowOpacity: isDark ? 0.4 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    card: {
      shadowColor: '#0B0B0F',
      shadowOpacity: isDark ? 0.45 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    accent: {
      shadowColor: palette.brand[500],
      shadowOpacity: isDark ? 0.35 : 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  } as const;
}

export const radius = {
  sm: 12,
  md: 16,
  card: 24,
  pill: 999,
} as const;

/** Gradient used for score arcs/dials: risk → caution → brand. */
export const scoreGradient = [palette.risk, palette.caution, palette.brand[400]] as const;

/** Map a 0–100 score to a calm color. */
export function colorForScore(score: number): string {
  if (score >= 75) return palette.brand[500];
  if (score >= 50) return palette.positive;
  if (score >= 30) return palette.caution;
  return palette.risk;
}
