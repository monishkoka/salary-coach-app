import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/layout/ThemedText';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export default function RootLayout() {
  const { ready } = useBootstrap();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {ready ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="money-gps" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="future-self" options={{ presentation: 'card', animation: 'slide_from_right' }} />
              <Stack.Screen name="payday" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
              }}
            >
              <ThemedText variant="title" tone="accent">
                Salary Coach AI
              </ThemedText>
            </View>
          )}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
