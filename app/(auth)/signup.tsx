import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/buttons/Button';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { applyZodErrors } from '@/utils/forms';

const schema = z.object({
  name: z.string().min(2, 'Tell us your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp, busy, error, clearError } = useAuthStore();
  const { control, handleSubmit, setError, formState } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => clearError, [clearError]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      return;
    }
    const ok = await signUp(parsed.data.email.trim(), parsed.data.password, parsed.data.name.trim());
    if (ok) router.replace('/(onboarding)/welcome');
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View className="mt-16">
          <ThemedText variant="title">Create your account</ThemedText>
          <ThemedText variant="body" tone="secondary" className="mt-2">
            Get your first salary blueprint in under 2 minutes.
          </ThemedText>
        </View>

        <View className="mt-10">
          <TextField control={control} name="name" label="Name" placeholder="Your name" />
          <TextField
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            control={control}
            name="password"
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
          />

          {error ? (
            <ThemedText variant="caption" className="mb-3" style={{ color: colors.risk }}>
              {error}
            </ThemedText>
          ) : null}

          <Button
            label="Create account"
            onPress={onSubmit}
            loading={busy || formState.isSubmitting}
          />

          <ThemedText variant="caption" tone="tertiary" className="mt-4 text-center">
            By continuing you agree to our Terms & Privacy Policy. Your data is encrypted and never
            sold.
          </ThemedText>

          <View className="mt-6 flex-row justify-center">
            <ThemedText variant="body" tone="secondary">
              Already have an account?{' '}
            </ThemedText>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <ThemedText variant="body" tone="accent" className="font-semibold">
                  Log in
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
