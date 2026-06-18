import { View } from 'react-native';
import type { AllocationLine, AllocationKey } from '@/types';
import { palette } from '@/constants/theme';

const SEGMENT_COLOR: Record<AllocationKey, string> = {
  needs: palette.ink[400],
  emergency: palette.brand[300],
  debt: palette.risk,
  investments: palette.brand[500],
  goals: palette.brand[600],
  lifestyle: palette.caution,
  tax: palette.ink[500],
};

interface AllocationBarProps {
  allocations: AllocationLine[];
  height?: number;
}

/** Horizontal stacked bar representing the paycheck split. */
export function AllocationBar({ allocations, height = 18 }: AllocationBarProps) {
  const total = allocations.reduce((s, a) => s + a.amountPaise, 0) || 1;
  return (
    <View
      style={{ height, borderRadius: height, overflow: 'hidden', flexDirection: 'row' }}
      accessibilityLabel="Salary allocation breakdown"
    >
      {allocations
        .filter((a) => a.amountPaise > 0)
        .map((a) => (
          <View
            key={a.key}
            style={{
              flex: a.amountPaise / total,
              backgroundColor: SEGMENT_COLOR[a.key],
            }}
          />
        ))}
    </View>
  );
}

export { SEGMENT_COLOR };
