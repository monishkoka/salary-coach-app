import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Card } from './Card';
import { AllocationBar, SEGMENT_COLOR } from '@/components/charts/AllocationBar';
import { ThemedText } from '@/components/layout/ThemedText';
import type { SalaryBlueprint } from '@/types';
import { formatINR } from '@/utils/currency';

interface AllocationCardProps {
  blueprint: SalaryBlueprint;
}

/** The signature blueprint card: stacked bar + tappable line items + "why". */
export function AllocationCard({ blueprint }: AllocationCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <ThemedText variant="heading">This Month’s Blueprint</ThemedText>
        <ThemedText variant="label" tone="accent">
          {formatINR(blueprint.incomePaise)}
        </ThemedText>
      </View>

      <View className="my-4">
        <AllocationBar allocations={blueprint.allocations} />
      </View>

      {blueprint.allocations
        .filter((a) => a.amountPaise > 0)
        .map((a) => {
          const open = expanded === a.key;
          return (
            <Pressable
              key={a.key}
              onPress={() => setExpanded(open ? null : a.key)}
              className="py-3"
              style={{ borderTopWidth: 1, borderTopColor: 'rgba(127,127,127,0.12)' }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: SEGMENT_COLOR[a.key],
                      marginRight: 10,
                    }}
                  />
                  <ThemedText variant="body" className="font-medium">
                    {a.label}
                  </ThemedText>
                </View>
                <View className="flex-row items-center">
                  <ThemedText variant="body" className="font-semibold">
                    {formatINR(a.amountPaise)}
                  </ThemedText>
                  <ThemedText variant="caption" tone="tertiary" className="ml-2 w-10 text-right">
                    {a.pct}%
                  </ThemedText>
                </View>
              </View>
              {open ? (
                <View className="mt-2">
                  <ThemedText variant="caption" tone="secondary">
                    {a.rationale}
                  </ThemedText>
                  {a.breakdown?.map((b) => (
                    <View key={b.label} className="mt-1 flex-row justify-between">
                      <ThemedText variant="caption" tone="tertiary">
                        • {b.label}
                      </ThemedText>
                      <ThemedText variant="caption" tone="tertiary">
                        {formatINR(b.amountPaise)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText variant="caption" tone="tertiary" className="mt-1">
                  Tap for why →
                </ThemedText>
              )}
            </Pressable>
          );
        })}
    </Card>
  );
}
