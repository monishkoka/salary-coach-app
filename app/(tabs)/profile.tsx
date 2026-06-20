import { Alert, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { Card } from '@/components/cards/Card';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { Button } from '@/components/buttons/Button';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { useTheme } from '@/hooks/useTheme';
import { useScreenView } from '@/hooks/useScreenView';
import { formatINR } from '@/utils/currency';
import { SALARY_DNA } from '@/constants/copy';
import { config } from '@/constants/config';

async function openExternal(url: string): Promise<void> {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert('Unavailable', 'Could not open this link right now.');
  } catch {
    Alert.alert('Unavailable', 'Could not open this link right now.');
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <ThemedText variant="body" tone="secondary">
        {label}
      </ThemedText>
      <ThemedText variant="body" className="font-medium">
        {value}
      </ThemedText>
    </View>
  );
}

export default function Profile() {
  const { colors } = useTheme();
  const user = useProfileStore((s) => s.user);
  const financials = useProfileStore((s) => s.financials);
  const goals = useProfileStore((s) => s.goals);
  const signOut = useAuthStore((s) => s.signOut);
  const tier = useSubscriptionStore((s) => s.tier);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  useScreenView('profile');

  const dna = user?.salaryDnaArchetype
    ? SALARY_DNA[user.salaryDnaArchetype as keyof typeof SALARY_DNA]
    : null;

  const MODES: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ];

  return (
    <Screen>
      <ThemedText variant="title" className="mt-2">
        Profile
      </ThemedText>

      {/* Identity */}
      <Card className="mt-5 items-center">
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.accentSoft }}
        >
          <ThemedText variant="title" tone="accent">
            {(user?.displayName ?? 'U').charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText variant="heading" className="mt-3">
          {user?.displayName ?? 'User'}
        </ThemedText>
        <ThemedText variant="caption" tone="secondary">
          {user?.email ?? ''}
        </ThemedText>
        {dna ? (
          <View
            className="mt-3 rounded-pill px-3 py-1"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <ThemedText variant="caption" tone="accent">
              {dna.icon} {dna.name} · {dna.tagline}
            </ThemedText>
          </View>
        ) : null}
      </Card>

      {/* Salary info */}
      <SectionHeader title="Your finances" />
      <Card>
        {financials ? (
          <>
            <Row label="Monthly salary" value={formatINR(financials.monthlyIncomePaise)} />
            <Row label="Monthly expenses" value={formatINR(financials.totalExpensesPaise)} />
            <Row label="Monthly surplus" value={formatINR(financials.monthlySurplusPaise)} />
            <Row label="Net worth" value={formatINR(financials.netWorthPaise)} />
            <Row label="Active goals" value={String(goals.length)} />
            <Row
              label="Risk profile"
              value={(user?.riskProfile ?? 'balanced').replace(/^\w/, (c) => c.toUpperCase())}
            />
          </>
        ) : null}
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card>
        <ThemedText variant="label" tone="secondary" className="mb-3">
          Theme
        </ThemedText>
        <View className="flex-row gap-2">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${m.label} theme`}
                className="flex-1 items-center rounded-2xl py-3"
                style={{
                  backgroundColor: active ? colors.accent : colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <ThemedText
                  variant="label"
                  style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
                >
                  {m.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Plan */}
      <SectionHeader title="Plan" />
      <Card onPress={() => router.push('/paywall')}>
        <View className="flex-row items-center justify-between py-1">
          <View>
            <ThemedText variant="body" className="font-semibold">
              {tier.toUpperCase()} plan
            </ThemedText>
            <ThemedText variant="caption" tone="secondary">
              {tier === 'free' ? 'Unlock Money GPS, Future Self & more' : 'Manage your subscription'}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Settings */}
      <SectionHeader title="Settings" />
      <Card>
        <Row label="Currency" value={user?.currency ?? 'INR'} />
        <Pressable
          className="flex-row items-center justify-between py-3"
          onPress={() => openExternal(config.links.privacyUrl)}
          accessibilityRole="link"
          accessibilityLabel="Open privacy and data policy"
        >
          <ThemedText variant="body" tone="secondary">
            Privacy & data
          </ThemedText>
          <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
        </Pressable>
        <Pressable
          className="flex-row items-center justify-between py-3"
          onPress={() =>
            openExternal(`mailto:${config.links.supportEmail}?subject=Salary%20Coach%20AI%20Support`)
          }
          accessibilityRole="link"
          accessibilityLabel="Contact help and support"
        >
          <ThemedText variant="body" tone="secondary">
            Help & support
          </ThemedText>
          <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
        </Pressable>
      </Card>

      <View className="mt-6">
        <Button
          label="Log out"
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        />
      </View>

      <ThemedText variant="caption" tone="tertiary" className="mt-6 text-center">
        Salary Coach AI v1.0 · Educational guidance, not regulated financial advice.
      </ThemedText>
    </Screen>
  );
}
