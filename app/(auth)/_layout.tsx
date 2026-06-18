import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboardingComplete);

  // Already signed in? Bounce out of the auth group.
  if (status === 'signedIn') {
    return <Redirect href={onboarded ? '/(tabs)' : '/(onboarding)/welcome'} />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
