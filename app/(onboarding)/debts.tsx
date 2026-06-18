import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import type { Debt, DebtType } from '@/types';
import { analytics } from '@/services/analytics';

const TYPES: { type: DebtType; label: string; rate: number }[] = [
  { type: 'credit_card', label: 'Credit card outstanding', rate: 42 },
  { type: 'personal', label: 'Personal loan', rate: 16 },
  { type: 'car', label: 'Car loan', rate: 10 },
  { type: 'home', label: 'Home loan', rate: 9 },
  { type: 'education', label: 'Education loan', rate: 11 },
];

export default function Debts() {
  const debts = useOnboardingStore((s) => s.debts);
  const set = useOnboardingStore((s) => s.set);

  const valueFor = (t: DebtType) =>
    debts.find((d) => d.type === t)?.principalOutstandingPaise ?? 0;

  const update = (t: DebtType, paise: number, rate: number) => {
    const others = debts.filter((d) => d.type !== t);
    if (paise <= 0) {
      set('debts', others);
      return;
    }
    const entry: Debt = {
      id: `debt-${t}`,
      userId: 'local',
      type: t,
      label: t,
      principalOutstandingPaise: paise,
      emiPaise: Math.round((paise * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -36))),
      interestRate: rate,
      tenureMonthsRemaining: 36,
      dueDay: 5,
    };
    set('debts', [...others, entry]);
  };

  return (
    <OnboardingShell
      step={7}
      totalSteps={10}
      title="Any debts?"
      subtitle="Outstanding balances. Clearing expensive debt is usually your best “investment.”"
      canSkip
      onSkip={() => router.push('/(onboarding)/goals')}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'debts' });
        router.push('/(onboarding)/goals');
      }}
    >
      {TYPES.map((t) => (
        <CurrencyField
          key={t.type}
          label={`${t.label} (~${t.rate}% p.a.)`}
          valuePaise={valueFor(t.type)}
          onChangePaise={(p) => update(t.type, p, t.rate)}
        />
      ))}
      <ThemedText variant="caption" tone="tertiary">
        No debt? Great — just tap Continue.
      </ThemedText>
    </OnboardingShell>
  );
}
