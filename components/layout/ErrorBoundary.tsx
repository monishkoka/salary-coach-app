import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { analytics } from '@/services/analytics';

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

    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          backgroundColor: '#0B0B0F',
        }}
      >
        <ThemedText className="mb-3 text-4xl">😕</ThemedText>
        <ThemedText variant="heading" className="text-center" style={{ color: '#F7F7F5' }}>
          Something went wrong
        </ThemedText>
        <ThemedText
          variant="body"
          className="mt-2 text-center"
          style={{ color: '#B3B3AF' }}
        >
          The app hit an unexpected error. Your data is safe — let’s try that again.
        </ThemedText>
        <View className="mt-8 w-full">
          <Button label="Reload" onPress={this.reset} />
        </View>
      </View>
    );
  }
}
