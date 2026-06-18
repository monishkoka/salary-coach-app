import { View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import { formatINR } from '@/utils/currency';
import type { ExpenseCategory } from '@/types';
import { analytics } from '@/services/analytics';

const FIELDS: { category: ExpenseCategory; label: string; essential: boolean }[] = [
  { category: 'rent', label: 'Rent / Home EMI', essential: true },
  { category: 'food', label: 'Food & groceries', essential: true },
  { category: 'transport', label: 'Transport', essential: true },
  { category: 'utilities', label: 'Bills & utilities', essential: true },
  { category: 'discretionary', label: 'Other / misc', essential: false },
];

export default function Expenses() {
  const expenses = useOnboardingStore((s) => s.expenses);
  const setExpense = useOnboardingStore((s) => s.setExpense);
  const total = expenses.reduce((s, e) => s + e.amountPaise, 0);

  const valueFor = (cat: ExpenseCategory) =>
    expenses.find((e) => e.category === cat)?.amountPaise ?? 0;

  return (
    <OnboardingShell
      step={4}
      totalSteps={10}
      title="Your monthly expenses"
      subtitle="Rough numbers are fine — you can refine them later."
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'expenses' });
        router.push('/(onboarding)/savings');
      }}
    >
      {FIELDS.map((f) => (
        <CurrencyField
          key={f.category}
          label={f.label}
          valuePaise={valueFor(f.category)}
          onChangePaise={(p) => setExpense(f.category, p, f.essential)}
        />
      ))}

      <View className="mt-2 flex-row items-center justify-between">
        <ThemedText variant="label" tone="secondary">
          Total monthly expenses
        </ThemedText>
        <ThemedText variant="heading" tone="accent">
          {formatINR(total)}
        </ThemedText>
      </View>
    </OnboardingShell>
  );
}
