import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { ThemedText } from '@/components/layout/ThemedText';
import { OptionGroup } from '@/components/forms/OptionGroup';
import { useOnboardingStore } from '@/store/onboardingStore';
import { analytics } from '@/services/analytics';

export default function Salary() {
  const income = useOnboardingStore((s) => s.monthlyIncomePaise);
  const growth = useOnboardingStore((s) => s.expectedGrowthPct);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={3}
      totalSteps={10}
      title="What’s your monthly salary?"
      subtitle="Enter your take-home (in-hand) amount after deductions."
      nextDisabled={income <= 0}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'salary' });
        router.push('/(onboarding)/expenses');
      }}
    >
      <CurrencyField
        label="Monthly in-hand salary"
        valuePaise={income}
        onChangePaise={(p) => set('monthlyIncomePaise', p)}
        quickAmounts={[50000, 75000, 100000, 150000, 200000]}
        autoFocus
      />

      <View className="mt-4">
        <ThemedText variant="label" tone="secondary" className="mb-2">
          Expected annual salary growth
        </ThemedText>
        <OptionGroup
          options={[
            { label: 'Modest — around 5%', value: 5 },
            { label: 'Typical — around 10%', value: 10 },
            { label: 'Fast — 15% or more', value: 15 },
          ]}
          selected={growth}
          onSelect={(v) => set('expectedGrowthPct', v)}
        />
      </View>
    </OnboardingShell>
  );
}
