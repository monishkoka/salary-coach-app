import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ThemedText } from '@/components/layout/ThemedText';
import { OptionGroup } from '@/components/forms/OptionGroup';
import { useOnboardingStore } from '@/store/onboardingStore';
import { RISK_QUESTIONS } from '@/constants/copy';
import { analytics } from '@/services/analytics';

export default function Risk() {
  const computeRisk = useOnboardingStore((s) => s.computeRisk);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const allAnswered = Object.keys(answers).length === RISK_QUESTIONS.length;
  const total = Object.values(answers).reduce((s, v) => s + v, 0);

  return (
    <OnboardingShell
      step={9}
      totalSteps={10}
      title="How do you feel about risk?"
      subtitle="This shapes how aggressively we recommend investing."
      nextDisabled={!allAnswered}
      onNext={() => {
        computeRisk(total);
        analytics.track('onboarding_step_completed', { step: 'risk', score: total });
        router.push('/(onboarding)/blueprint');
      }}
    >
      <View className="gap-6">
        {RISK_QUESTIONS.map((q) => (
          <View key={q.id}>
            <ThemedText variant="body" className="mb-3 font-medium">
              {q.prompt}
            </ThemedText>
            <OptionGroup
              options={q.options.map((o) => ({ label: o.label, value: o.score }))}
              selected={answers[q.id] ?? null}
              onSelect={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            />
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
