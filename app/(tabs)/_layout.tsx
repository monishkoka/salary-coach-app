import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboardingComplete);

  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  if (!onboarded) return <Redirect href="/(onboarding)/welcome" />;

  const icon = (name: IoniconName, focusedName: IoniconName) => {
    const TabBarIcon = ({
      color,
      focused,
      size,
    }: {
      color: string;
      focused: boolean;
      size: number;
    }) => <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
    TabBarIcon.displayName = `TabBarIcon(${name})`;
    return TabBarIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Plan', tabBarIcon: icon('flag-outline', 'flag') }}
      />
      <Tabs.Screen
        name="coach"
        options={{ title: 'Coach', tabBarIcon: icon('sparkles-outline', 'sparkles') }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'Insights', tabBarIcon: icon('bar-chart-outline', 'bar-chart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
