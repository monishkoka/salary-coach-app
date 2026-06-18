import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { palette } from '@/constants/theme';
import { paiseToRupees } from '@/utils/currency';

export interface ProjectionSeries {
  label: string;
  /** Paise values aligned to `labels`. */
  points: number[];
}

interface ProjectionChartProps {
  labels: string[];
  /** Primary (highlighted) series — e.g. the selected scenario. */
  primary: ProjectionSeries;
  /** Optional comparison series — e.g. the current path. */
  comparison?: ProjectionSeries;
  height?: number;
}

/**
 * Net-worth projection line. Plots a highlighted scenario against an optional
 * comparison baseline (current path). Values are paise; we scale to lakhs so
 * gifted-charts axis math stays in a sane numeric range.
 */
export function ProjectionChart({ labels, primary, comparison, height = 200 }: ProjectionChartProps) {
  const { colors } = useTheme();
  const accent = colors.accent;

  // Scale to lakhs for chart-internal math (1 lakh = 100000 rupees).
  const toLakh = (paise: number) => Math.round((paiseToRupees(paise) / 100000) * 10) / 10;

  const primaryData = primary.points.map((p, i) => ({ value: toLakh(p), label: labels[i] ?? '' }));
  const comparisonData = comparison?.points.map((p, i) => ({ value: toLakh(p), label: labels[i] ?? '' }));

  return (
    <View style={{ marginLeft: -8 }}>
      <LineChart
        data={primaryData}
        data2={comparisonData}
        height={height}
        thickness={3}
        color={accent}
        color2={palette.ink[400]}
        startFillColor={accent}
        endFillColor={colors.surface}
        startOpacity={0.22}
        endOpacity={0.02}
        areaChart
        curved
        hideRules
        hideYAxisText
        yAxisColor="transparent"
        xAxisColor={colors.border}
        xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
        dataPointsColor={accent}
        dataPointsColor2={palette.ink[400]}
        adjustToWidth
        disableScroll
      />
    </View>
  );
}
