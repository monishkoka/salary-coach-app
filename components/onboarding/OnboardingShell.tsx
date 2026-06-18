import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { useTheme } from '@/hooks/useTheme';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
}

/** Shared scaffold for every onboarding step: progress bar, header, CTA. */
export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  canSkip,
  onSkip,
}: OnboardingShellProps) {
  const { colors } = useTheme();
  const progress = (step / totalSteps) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View className="flex-1 px-5">
          <View className="mt-2 flex-row items-center">
            {step > 1 ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                className="mr-3 h-9 w-9 items-center justify-center rounded-pill"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </Pressable>
            ) : null}
            <View
              className="h-2 flex-1 overflow-hidden rounded-pill"
              style={{ backgroundColor: colors.border }}
            >
              <View
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: colors.accent,
                  borderRadius: 999,
                }}
              />
            </View>
            {canSkip ? (
              <Pressable onPress={onSkip} hitSlop={12} className="pl-3">
                <ThemedText variant="label" tone="secondary">
                  Skip
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: 28, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText variant="caption" tone="accent" className="uppercase tracking-widest">
              Step {step} of {totalSteps}
            </ThemedText>
            <ThemedText variant="title" className="mt-2">
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText variant="body" tone="secondary" className="mt-2 leading-6">
                {subtitle}
              </ThemedText>
            ) : null}

            <View className="mt-7">{children}</View>
          </ScrollView>

          <View className="pb-2 pt-2">
            <Button label={nextLabel} onPress={onNext} disabled={nextDisabled} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
