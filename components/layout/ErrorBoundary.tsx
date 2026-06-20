import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { analytics } from '@/services/analytics';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide crash guard. A render error anywhere in the tree would otherwise
 * white-screen the app (a guaranteed App Store rejection). This catches it,
 * reports it, and offers a recovery action instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    analytics.track('app_error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    if (__DEV__) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return <ErrorFallback onReset={this.reset} />;
  }
}

/** Themed fallback so light-mode users don't get a jarring dark crash screen. */
function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        backgroundColor: colors.background,
      }}
    >
      <ThemedText className="mb-3 text-4xl">😕</ThemedText>
      <ThemedText variant="heading" className="text-center">
        Something went wrong
      </ThemedText>
      <ThemedText variant="body" tone="secondary" className="mt-2 text-center">
        The app hit an unexpected error. Your data is safe — let’s try that again.
      </ThemedText>
      <View className="mt-8 w-full">
        <Button label="Reload" onPress={onReset} />
      </View>
    </View>
  );
}
