import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { ChatMessage } from '@/types';
import { TypingDots } from './TypingDots';

function MessageBubbleBase({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View
      className="mb-3 max-w-[85%]"
      style={{ alignSelf: isUser ? 'flex-end' : 'flex-start' }}
    >
      <View
        className="rounded-3xl px-4 py-3"
        style={{
          backgroundColor: isUser ? colors.accent : colors.surface,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
          borderBottomRightRadius: isUser ? 6 : 24,
          borderBottomLeftRadius: isUser ? 24 : 6,
        }}
      >
        {message.pending ? (
          <TypingDots />
        ) : (
          <ThemedText
            variant="body"
            style={isUser ? { color: '#FFFFFF' } : undefined}
          >
            {message.content}
          </ThemedText>
        )}
      </View>

      {message.attachments?.map((att, idx) => (
        <View
          key={idx}
          className="mt-2 rounded-2xl p-3"
          style={{ backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}
        >
          <ThemedText variant="caption" tone="accent" className="mb-1 font-semibold">
            {att.title}
          </ThemedText>
          {Object.entries(att.data).map(([k, v]) => (
            <View key={k} className="flex-row justify-between py-0.5">
              <ThemedText variant="caption" tone="tertiary">
                {k.replace(/_/g, ' ')}
              </ThemedText>
              <ThemedText variant="caption">{String(v)}</ThemedText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Memoized so appending a message only renders the new bubble, not the whole
 * thread. Messages are immutable once created (only `pending` flips), so a
 * shallow id/pending/content comparison is sufficient.
 */
export const MessageBubble = memo(
  MessageBubbleBase,
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.pending === next.message.pending &&
    prev.message.content === next.message.content,
);
