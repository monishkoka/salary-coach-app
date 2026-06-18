import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/buttons/Button';
import { sendPasswordReset } from '@/services/supabase/auth';
import { useTheme } from '@/hooks/useTheme';
import { applyZodErrors } from '@/utils/forms';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { control, handleSubmit, setError: setFieldError } = useForm({
    defaultValues: { email: '' },
  });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(parsed.error, setFieldError);
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await sendPasswordReset(parsed.data.email.trim());
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  });

  return (
    <Screen>
      <View className="mt-16">
        <ThemedText variant="title">Reset password</ThemedText>
        <ThemedText variant="body" tone="secondary" className="mt-2">
          {sent
            ? 'Check your inbox — we’ve sent you a secure reset link.'
            : 'Enter your email and we’ll send you a reset link.'}
        </ThemedText>
      </View>

      <View className="mt-10">
        {!sent ? (
          <>
            <TextField
              control={control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error ? (
              <ThemedText variant="caption" className="mb-3" style={{ color: colors.risk }}>
                {error}
              </ThemedText>
            ) : null}
            <Button label="Send reset link" onPress={onSubmit} loading={busy} />
          </>
        ) : (
          <Button label="Back to login" onPress={() => router.replace('/(auth)/login')} />
        )}
      </View>
    </Screen>
  );
}
