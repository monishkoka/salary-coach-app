import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { colorForScore, palette } from '@/constants/theme';

interface VelocityDialProps {
  /** Current velocity 0–100. */
  current: number;
  /** Recommended (achievable) velocity 0–100. Drawn as a ghost target. */
  recommended?: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Wealth Velocity dial. Same proven 270° geometry as the score arc, but draws a
 * faint "recommended" target arc behind the solid "current" arc so the gap to
 * your optimal route reads at a glance — the speedometer for your money.
 */
export function VelocityDial({ current, recommended, size = 184, strokeWidth = 14 }: VelocityDialProps) {
  const { colors } = useTheme();
  const cur = Math.max(0, Math.min(100, current));
  const rec = recommended != null ? Math.max(0, Math.min(100, recommended)) : null;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcFraction = 0.75;
  const drawable = circumference * arcFraction;
  const offsetFor = (v: number) => drawable * (1 - v / 100);
  const valueColor = colorForScore(cur);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '135deg' }] }}>
        <Defs>
          <LinearGradient id="velGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.brand[300]} />
            <Stop offset="1" stopColor={valueColor} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${drawable} ${circumference}`}
        />
        {/* Recommended target (ghost) */}
        {rec != null ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.brand[300]}
            strokeOpacity={0.45}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${drawable} ${circumference}`}
            strokeDashoffset={offsetFor(rec)}
          />
        ) : null}
        {/* Current */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#velGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${drawable} ${circumference}`}
          strokeDashoffset={offsetFor(cur)}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <ThemedText variant="hero" style={{ color: valueColor }}>
          {cur}
        </ThemedText>
        <ThemedText variant="caption" tone="secondary" className="uppercase tracking-widest">
          velocity
        </ThemedText>
        {rec != null && rec > cur ? (
          <ThemedText variant="caption" tone="accent" className="mt-1">
            ↑ {rec} achievable
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
