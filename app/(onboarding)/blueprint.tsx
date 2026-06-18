import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { AllocationCard } from '@/components/cards/AllocationCard';
import { ScoreArc } from '@/components/charts/ScoreArc';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useProfileStore } from '@/store/profileStore';
import { useBlueprintStore } from '@/store/blueprintStore';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

const BUILD_STEPS = [
  'Analyzing your salary…',
  'Checking your emergency buffer…',
  'Optimizing for your goals…',
  'Balancing risk and growth…',
  'Finalizing your blueprint…',
];

export default function BlueprintReveal() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<'building' | 'ready'>('building');
  const [stepIdx, setStepIdx] = useState(0);

  const onboarding = useOnboardingStore.getState();
  const hydrate = useProfileStore((s) => s.hydrateFromOnboarding);
  const scores = useProfileStore((s) => s.scores);
  const generate = useBlueprintStore((s) => s.generate);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const finishOnboarding = useAuthStore((s) => s.finishOnboarding);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  useEffect(() => {
    // Commit the collected onboarding data, compute scores, build the blueprint.
    hydrate({
      user: { displayName: onboarding.name, age: onboarding.age },
      financials: {
        monthlyIncomePaise: onboarding.monthlyIncomePaise,
        expectedGrowthPct: onboarding.expectedGrowthPct,
        totalSavingsPaise: onboarding.savingsPaise,
        emergencyFundPaise: onboarding.emergencyFundPaise,
        emergencyMonthsTarget: 6,
      },
      expenses: onboarding.expenses,
      investments: onboarding.investments,
      debts: onboarding.debts,
      goals: onboarding.goals,
      riskProfile: onboarding.riskProfile,
    });
    generate();

    const interval = setInterval(() => {
      setStepIdx((i) => {
        if (i >= BUILD_STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => setPhase('ready'), 500);
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'building') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="large" color={colors.accent} />
          <ThemedText variant="heading" className="mt-8 text-center">
            Building your blueprint
          </ThemedText>
          <ThemedText variant="body" tone="secondary" className="mt-2 text-center">
            {BUILD_STEPS[stepIdx]}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const health = scores?.healthScore ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-5">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className="mt-6 items-center">
            <ThemedText variant="caption" tone="accent" className="uppercase tracking-widest">
              Your blueprint is ready
            </ThemedText>
            <View className="my-2">
              <ScoreArc score={health} label="Health Score" size={150} />
            </View>
            <ThemedText variant="body" tone="secondary" className="text-center">
              Here’s exactly what to do with your next salary.
            </ThemedText>
          </View>

          <View className="mt-4">{blueprint ? <AllocationCard blueprint={blueprint} /> : null}</View>
        </ScrollView>

        <View className="pb-6 pt-2">
          <Button
            label="Go to my dashboard"
            onPress={() => {
              finishOnboarding();
              resetOnboarding();
              router.replace('/(tabs)');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
