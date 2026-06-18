import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';

interface TrendChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

/** Compact line chart for insights/trends, themed and area-filled. */
export function TrendChart({ data, color, height = 120 }: TrendChartProps) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.accent;

  const points = data.map((d) => ({ value: d.value, label: d.label }));

  return (
    <View style={{ marginLeft: -8 }}>
      <LineChart
        data={points}
        height={height}
        thickness={3}
        color={lineColor}
        startFillColor={lineColor}
        endFillColor={colors.surface}
        startOpacity={0.25}
        endOpacity={0.02}
        areaChart
        curved
        hideRules
        hideYAxisText
        yAxisColor="transparent"
        xAxisColor={colors.border}
        xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
        dataPointsColor={lineColor}
        adjustToWidth
        disableScroll
      />
    </View>
  );
}
