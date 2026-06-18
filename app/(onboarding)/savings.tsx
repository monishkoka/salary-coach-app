import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import { analytics } from '@/services/analytics';

export default function Savings() {
  const savings = useOnboardingStore((s) => s.savingsPaise);
  const emergency = useOnboardingStore((s) => s.emergencyFundPaise);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={5}
      totalSteps={10}
      title="What have you saved?"
      subtitle="Money sitting in your bank, FDs or easily accessible."
      canSkip
      onSkip={() => router.push('/(onboarding)/investments')}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'savings' });
        router.push('/(onboarding)/investments');
      }}
    >
      <CurrencyField
        label="Total savings (bank + FDs)"
        valuePaise={savings}
        onChangePaise={(p) => set('savingsPaise', p)}
        autoFocus
      />
      <ThemedText variant="label" tone="secondary" className="mb-2 mt-2">
        Of that, how much is your emergency fund?
      </ThemedText>
      <CurrencyField
        valuePaise={emergency}
        onChangePaise={(p) => set('emergencyFundPaise', p)}
      />
      <ThemedText variant="caption" tone="tertiary">
        Your emergency fund is money set aside purely for unexpected events — job loss, medical, etc.
      </ThemedText>
    </OnboardingShell>
  );
}
