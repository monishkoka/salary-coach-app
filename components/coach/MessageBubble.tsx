import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import type { ChatMessage } from '@/types';
import { TypingDots } from './TypingDots';

/** Turn snake_case / camelCase keys into readable Title Case labels. */
function humanize(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b(inr|emi|sip|pct)\b/gi, (m) => m.toUpperCase())
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isHidden(v: unknown): boolean {
  return v == null || (typeof v === 'object' && !Array.isArray(v));
}

function formatValue(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

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
          {Object.entries(att.data)
            .filter(([, v]) => !isHidden(v))
            .map(([k, v]) =>
              Array.isArray(v) ? (
                <View key={k} className="pt-1.5">
                  <ThemedText variant="caption" tone="tertiary">
                    {humanize(k)}
                  </ThemedText>
                  {v.map((line, i) => (
                    <ThemedText key={i} variant="caption" className="mt-0.5">
                      • {String(line)}
                    </ThemedText>
                  ))}
                </View>
              ) : (
                <View key={k} className="flex-row justify-between py-0.5">
                  <ThemedText variant="caption" tone="tertiary">
                    {humanize(k)}
                  </ThemedText>
                  <ThemedText variant="caption" className="ml-3 flex-1 text-right">
                    {formatValue(v)}
                  </ThemedText>
                </View>
              ),
            )}
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
