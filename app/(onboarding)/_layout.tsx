import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function OnboardingLayout() {
  const status = useAuthStore((s) => s.status);
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }} />
  );
}
