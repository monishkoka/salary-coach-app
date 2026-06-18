import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import { GOAL_PRESETS } from '@/constants/copy';
import { useTheme } from '@/hooks/useTheme';
import { addMonthsISO } from '@/utils/date';
import type { Goal } from '@/types';
import { analytics } from '@/services/analytics';

export default function Goals() {
  const { colors } = useTheme();
  const goals = useOnboardingStore((s) => s.goals);
  const toggleGoal = useOnboardingStore((s) => s.toggleGoal);

  const isSelected = (id: string) => goals.some((g) => g.id === id);

  return (
    <OnboardingShell
      step={8}
      totalSteps={10}
      title="What are you saving for?"
      subtitle="Pick the goals that matter. We’ll fund them in priority order."
      nextDisabled={goals.length === 0}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'goals', count: goals.length });
        router.push('/(onboarding)/risk');
      }}
    >
      <View className="flex-row flex-wrap gap-3">
        {GOAL_PRESETS.map((preset, idx) => {
          const id = `goal-${preset.type}`;
          const active = isSelected(id);
          return (
            <Pressable
              key={id}
              onPress={() => {
                const goal: Goal = {
                  id,
                  userId: 'local',
                  type: preset.type,
                  name: preset.name,
                  icon: preset.icon,
                  targetAmountPaise: preset.suggestedAmountPaise,
                  currentAmountPaise: 0,
                  targetDate: addMonthsISO(preset.suggestedMonths),
                  priority: goals.length + 1,
                  monthlyContributionPaise: 0,
                  probabilityOfSuccess: null,
                  status: 'on_track',
                };
                toggleGoal(goal);
              }}
              className="rounded-2xl p-4"
              style={{
                width: '47%',
                backgroundColor: active ? colors.accentSoft : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <ThemedText className="text-2xl">{preset.icon}</ThemedText>
              <ThemedText
                variant="body"
                className="mt-2 font-medium"
                style={active ? { color: colors.accent } : undefined}
              >
                {preset.name}
              </ThemedText>
              {active ? (
                <ThemedText variant="caption" tone="accent" className="mt-1">
                  Priority {goals.findIndex((g) => g.id === id) + 1}
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
