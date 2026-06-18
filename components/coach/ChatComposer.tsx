import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <View
      className="flex-row items-end px-4 py-3"
      style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask your coach anything…"
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel="Message to your coach"
        multiline
        className="mr-2 max-h-28 flex-1 rounded-3xl px-4 py-3 text-base"
        style={{
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
      <Pressable
        onPress={submit}
        disabled={disabled || !text.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: disabled || !text.trim() }}
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.accent, opacity: disabled || !text.trim() ? 0.4 : 1 }}
      >
        <ThemedText style={{ color: '#FFFFFF', fontSize: 18 }}>↑</ThemedText>
      </Pressable>
    </View>
  );
}
