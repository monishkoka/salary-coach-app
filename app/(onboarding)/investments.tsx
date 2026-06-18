import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import type { AssetClass, Investment } from '@/types';
import { analytics } from '@/services/analytics';

const CLASSES: { assetClass: AssetClass; label: string }[] = [
  { assetClass: 'mf', label: 'Mutual funds / SIPs' },
  { assetClass: 'equity', label: 'Stocks' },
  { assetClass: 'epf', label: 'EPF / PPF' },
  { assetClass: 'nps', label: 'NPS' },
  { assetClass: 'gold', label: 'Gold' },
];

export default function Investments() {
  const investments = useOnboardingStore((s) => s.investments);
  const set = useOnboardingStore((s) => s.set);

  const valueFor = (ac: AssetClass) =>
    investments.find((i) => i.assetClass === ac)?.currentValuePaise ?? 0;

  const update = (ac: AssetClass, paise: number) => {
    const others = investments.filter((i) => i.assetClass !== ac);
    if (paise <= 0) {
      set('investments', others);
      return;
    }
    const entry: Investment = {
      id: `inv-${ac}`,
      userId: 'local',
      assetClass: ac,
      instrumentName: ac.toUpperCase(),
      currentValuePaise: paise,
      investedValuePaise: paise,
      sipAmountPaise: null,
      sipDay: null,
      expectedReturnPct: ac === 'epf' ? 8 : ac === 'gold' ? 7 : 12,
    };
    set('investments', [...others, entry]);
  };

  return (
    <OnboardingShell
      step={6}
      totalSteps={10}
      title="Your investments"
      subtitle="Current value of what you’ve already invested. Skip anything you don’t have."
      canSkip
      onSkip={() => router.push('/(onboarding)/debts')}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'investments' });
        router.push('/(onboarding)/debts');
      }}
    >
      {CLASSES.map((c) => (
        <CurrencyField
          key={c.assetClass}
          label={c.label}
          valuePaise={valueFor(c.assetClass)}
          onChangePaise={(p) => update(c.assetClass, p)}
        />
      ))}
      <ThemedText variant="caption" tone="tertiary">
        We use this to measure diversification and project your future net worth.
      </ThemedText>
    </OnboardingShell>
  );
}
