import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { colorForScore, palette } from '@/constants/theme';

interface ScoreArcProps {
  score: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
  caption?: string;
}

/**
 * Apple-Fitness-style 270° arc gauge. Pure SVG so it renders crisply at any
 * size and animates well. The track is a faint full arc; the value arc fills
 * proportionally and is colored by score band.
 */
export function ScoreArc({
  score,
  size = 180,
  strokeWidth = 14,
  label,
  caption,
}: ScoreArcProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 270° arc → 75% of the circle is drawable; rotate so the gap sits at bottom.
  const arcFraction = 0.75;
  const drawable = circumference * arcFraction;
  const dashOffset = drawable * (1 - clamped / 100);
  const valueColor = colorForScore(clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '135deg' }] }}>
        <Defs>
          <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.brand[300]} />
            <Stop offset="1" stopColor={valueColor} />
          </LinearGradient>
        </Defs>
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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${drawable} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <ThemedText variant="hero" style={{ color: valueColor }}>
          {clamped}
        </ThemedText>
        {label ? (
          <ThemedText variant="caption" tone="secondary" className="uppercase tracking-widest">
            {label}
          </ThemedText>
        ) : null}
        {caption ? (
          <ThemedText variant="caption" tone="tertiary" className="mt-1">
            {caption}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
