import { useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/layout/ThemedText';
import { MessageBubble } from '@/components/coach/MessageBubble';
import { ChatComposer } from '@/components/coach/ChatComposer';
import { SuggestionChips } from '@/components/coach/SuggestionChips';
import { useCoachStore } from '@/store/coachStore';
import { useTheme } from '@/hooks/useTheme';
import { useScreenView } from '@/hooks/useScreenView';
import { COACH_SUGGESTED_PROMPTS } from '@/constants/copy';
import type { ChatMessage } from '@/types';

export default function Coach() {
  const { colors } = useTheme();
  const messages = useCoachStore((s) => s.messages);
  const sending = useCoachStore((s) => s.sending);
  const error = useCoachStore((s) => s.error);
  const send = useCoachStore((s) => s.send);
  const retry = useCoachStore((s) => s.retry);
  const retryText = useCoachStore((s) => s.retryText);
  const limitReached = useCoachStore((s) => s.limitReached);
  const remaining = useCoachStore((s) => s.remainingMessages());
  const listRef = useRef<FlatList<ChatMessage>>(null);
  useScreenView('coach');

  const showRemaining = Number.isFinite(remaining) && !limitReached;

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="px-5 pb-2 pt-2">
        <ThemedText variant="title">Coach</ThemedText>
        <ThemedText variant="caption" tone="secondary" className="mt-0.5">
          Knows your full financial picture
        </ThemedText>
        {showRemaining ? (
          <ThemedText variant="caption" tone="tertiary" className="mt-0.5">
            {remaining} free {remaining === 1 ? 'message' : 'messages'} left this month
          </ThemedText>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        />

        {error ? (
          <View className="mx-4 mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.risk }}
          >
            <ThemedText variant="caption" className="flex-1 pr-3" style={{ color: colors.risk }}>
              {error}
            </ThemedText>
            {retryText ? (
              <Pressable
                onPress={retry}
                accessibilityRole="button"
                accessibilityLabel="Retry sending your message"
                hitSlop={8}
                className="rounded-full px-3 py-2"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <ThemedText variant="caption" tone="accent" className="font-semibold">
                  Try again
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {limitReached ? (
          <View className="px-4 pb-2">
            <Pressable
              onPress={() => router.push('/paywall')}
              className="items-center rounded-2xl py-3"
              style={{ backgroundColor: colors.accent }}
              accessibilityRole="button"
              accessibilityLabel="Upgrade to Pro for unlimited coaching"
            >
              <ThemedText variant="body" className="font-semibold" style={{ color: '#FFFFFF' }}>
                Upgrade to Pro for unlimited coaching
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {messages.length <= 1 ? (
          <SuggestionChips prompts={COACH_SUGGESTED_PROMPTS} onPick={send} />
        ) : null}

        <ChatComposer onSend={send} disabled={sending || limitReached} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
