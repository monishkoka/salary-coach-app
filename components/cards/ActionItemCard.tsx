import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { ActionPlanItem, RecommendationCategory } from '@/types';

const CATEGORY_ICON: Record<RecommendationCategory, string> = {
  debt: '💳',
  emergency: '🛟',
  investment: '📈',
  tax: '🧾',
  savings: '🏦',
  spending_limit: '✂️',
  goal: '🎯',
  insurance: '🛡️',
  behavior: '🧭',
};

interface ActionItemCardProps {
  item: ActionPlanItem;
  done?: boolean;
  onToggle?: () => void;
}

/** A single prioritized action with quantified impact and a "mark done" tap. */
export function ActionItemCard({ item, done, onToggle }: ActionItemCardProps) {
  const { colors } = useTheme();

  return (
    <Card flat inset className="flex-row items-start gap-3">
      <ThemedText className="text-xl">{CATEGORY_ICON[item.category]}</ThemedText>
      <View className="flex-1">
        <ThemedText variant="body" className="font-semibold" style={done ? { opacity: 0.55 } : undefined}>
          {item.title}
        </ThemedText>
        <ThemedText variant="caption" tone="secondary" className="mt-0.5">
          {item.body}
        </ThemedText>
        <View className="mt-2 flex-row items-center gap-2">
          <View className="rounded-pill px-2 py-0.5" style={{ backgroundColor: colors.accentSoft }}>
            <ThemedText variant="caption" tone="accent" className="font-semibold">
              {item.impactLabel}
            </ThemedText>
          </View>
          <ThemedText variant="caption" tone="tertiary" className="uppercase">
            {item.effort} effort
          </ThemedText>
        </View>
      </View>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!done }}
        accessibilityLabel={done ? 'Mark action not done' : 'Mark action done'}
      >
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={done ? colors.positive : colors.textTertiary}
        />
      </Pressable>
    </Card>
  );
}
