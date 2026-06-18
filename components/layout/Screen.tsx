import { type ReactElement, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  /** Extra bottom padding so content clears the tab bar / home indicator. */
  contentClassName?: string;
  /** Optional pull-to-refresh control (rendered on the scroll view). */
  refreshControl?: ReactElement;
}

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentClassName = 'px-5 pb-24',
  refreshControl,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={refreshControl}
        >
          <View className={contentClassName}>{children}</View>
        </ScrollView>
      ) : (
        <View className={`flex-1 ${contentClassName}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
