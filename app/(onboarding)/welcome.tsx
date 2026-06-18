import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { Card } from '@/components/cards/Card';
import { palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const HIGHLIGHTS = [
  { icon: '🧭', title: 'Know exactly what to do', body: 'Every paycheck gets a personalized, explained plan.' },
  { icon: '🤖', title: 'A coach that knows your numbers', body: 'Ask “Can I afford a car?” and get a real answer.' },
  { icon: '🔒', title: 'Private by design', body: 'Encrypted, never sold. Your money, your data.' },
];

export default function Welcome() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <View className="flex-1 justify-between pb-6">
        <LinearGradient
          colors={[palette.brand[600], palette.brand[400]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.2 }}
          style={{
            paddingTop: 88,
            paddingBottom: 40,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          <ThemedText
            variant="caption"
            className="uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Salary Coach AI
          </ThemedText>
          <ThemedText variant="hero" className="mt-3 text-5xl leading-tight" style={{ color: '#FFFFFF' }}>
            Your personal{'\n'}CFO.
          </ThemedText>
          <ThemedText variant="body" className="mt-3 text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Most apps track spending. We tell you what to do with your next salary.
          </ThemedText>
        </LinearGradient>

        <View className="gap-3 px-5">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} className="flex-row items-center">
              <ThemedText className="mr-3 text-2xl">{h.icon}</ThemedText>
              <View className="flex-1">
                <ThemedText variant="body" className="font-semibold">
                  {h.title}
                </ThemedText>
                <ThemedText variant="caption" tone="secondary" className="mt-0.5">
                  {h.body}
                </ThemedText>
              </View>
            </Card>
          ))}
        </View>

        <View className="px-5">
          <Button label="Build my blueprint" onPress={() => router.push('/(onboarding)/about')} />
          <ThemedText variant="caption" tone="tertiary" className="mt-3 text-center">
            Takes about 2 minutes. You can edit anything later.
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}
