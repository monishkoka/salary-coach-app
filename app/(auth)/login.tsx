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
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, busy, error, clearError } = useAuthStore();
  const { control, handleSubmit, setError } = useForm({
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => clearError, [clearError]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      return;
    }
    const ok = await signIn(parsed.data.email.trim(), parsed.data.password);
    if (ok) router.replace('/');
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View className="mt-16">
          <ThemedText variant="title">Welcome back</ThemedText>
          <ThemedText variant="body" tone="secondary" className="mt-2">
            Your personal CFO is ready. Let’s pick up where you left off.
          </ThemedText>
        </View>

        <View className="mt-10">
          <TextField
            control={control}
            name="email"
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable className="mb-6 self-end">
              <ThemedText variant="label" tone="accent">
                Forgot password?
              </ThemedText>
            </Pressable>
          </Link>

          {error ? (
            <ThemedText variant="caption" className="mb-3" style={{ color: colors.risk }}>
              {error}
            </ThemedText>
          ) : null}

          <Button label="Log in" onPress={onSubmit} loading={busy} />

          <View className="mt-6 flex-row justify-center">
            <ThemedText variant="body" tone="secondary">
              New here?{' '}
            </ThemedText>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <ThemedText variant="body" tone="accent" className="font-semibold">
                  Create an account
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
