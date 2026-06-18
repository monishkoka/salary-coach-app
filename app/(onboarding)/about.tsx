import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ThemedText } from '@/components/layout/ThemedText';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/services/analytics';

export default function About() {
  const { colors } = useTheme();
  const name = useOnboardingStore((s) => s.name);
  const age = useOnboardingStore((s) => s.age);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={2}
      totalSteps={10}
      title="First, the basics"
      subtitle="This helps us tailor advice to your life stage."
      nextDisabled={!name.trim()}
      onNext={() => {
        analytics.track('onboarding_step_completed', { step: 'about' });
        router.push('/(onboarding)/salary');
      }}
    >
      <View>
        <ThemedText variant="label" tone="secondary" className="mb-2">
          Your name
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={(t) => set('name', t)}
          placeholder="e.g. Priya"
          placeholderTextColor={colors.textTertiary}
          className="mb-6 h-14 rounded-2xl px-4 text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderWidth: 1.5,
            borderColor: colors.border,
          }}
        />

        <ThemedText variant="label" tone="secondary" className="mb-2">
          Your age
        </ThemedText>
        <TextInput
          value={age ? String(age) : ''}
          onChangeText={(t) => set('age', Number(t.replace(/[^0-9]/g, '')) || null)}
          placeholder="e.g. 28"
          keyboardType="number-pad"
          placeholderTextColor={colors.textTertiary}
          className="h-14 rounded-2xl px-4 text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderWidth: 1.5,
            borderColor: colors.border,
          }}
        />
      </View>
    </OnboardingShell>
  );
}
