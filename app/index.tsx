import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry route — decides where to send the user:
 *   signed out            → auth
 *   signed in, no onboard → onboarding
 *   signed in, onboarded  → tabs
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboardingComplete);

  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  if (!onboarded) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)" />;
}
