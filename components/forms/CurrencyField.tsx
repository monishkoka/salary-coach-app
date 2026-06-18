import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { formatINRCompact, paiseToRupees, rupeesToPaise } from '@/utils/currency';

interface CurrencyFieldProps {
  label?: string;
  valuePaise: number;
  onChangePaise: (paise: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Optional quick-fill chips (rupee amounts) shown under the field. */
  quickAmounts?: number[];
}

const paiseToText = (paise: number): string =>
  paise > 0 ? Math.round(paiseToRupees(paise)).toString() : '';

const groupIndian = (digits: string): string => {
  if (!digits) return '';
  const n = Number(digits);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : digits;
};

/**
 * Rupee input. Users type rupees; we store paise. Keeps a local text buffer so
 * the user can clear it or set it to 0 freely (0 is a valid amount). Shows a
 * live compact preview (₹1.4L) and Indian digit grouping while typing.
 */
export function CurrencyField({
  label,
  valuePaise,
  onChangePaise,
  placeholder = '0',
  autoFocus,
  quickAmounts,
}: CurrencyFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState<string>(() => paiseToText(valuePaise));
  const inputRef = useRef<TextInput>(null);

  // Sync when the value is changed programmatically from outside (e.g. editing
  // an existing goal, or a reset) — but never clobber what the user is typing.
  useEffect(() => {
    const current = text === '' ? 0 : rupeesToPaise(Number(text));
    if (current !== valuePaise) setText(paiseToText(valuePaise));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuePaise]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    // Drop leading zeros but allow a single standalone "0".
    const normalized = digits.replace(/^0+(?=\d)/, '');
    setText(normalized);
    onChangePaise(normalized === '' ? 0 : rupeesToPaise(Number(normalized)));
  };

  return (
    <View className="mb-4">
      {label ? (
        <ThemedText variant="label" tone="secondary" className="mb-2">
          {label}
        </ThemedText>
      ) : null}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="h-16 flex-row items-center rounded-2xl px-4"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.border,
        }}
      >
        <ThemedText variant="title" tone={text ? 'primary' : 'tertiary'} className="mr-1.5">
          ₹
        </ThemedText>
        <TextInput
          ref={inputRef}
          value={groupIndian(text)}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          className="flex-1 text-2xl font-bold"
          style={{ color: colors.textPrimary }}
        />
        {valuePaise > 0 ? (
          <View
            className="rounded-pill px-2.5 py-1"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <ThemedText variant="caption" tone="accent" className="font-semibold">
              {formatINRCompact(valuePaise)}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>

      {quickAmounts && quickAmounts.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {quickAmounts.map((amt) => (
            <Pressable
              key={amt}
              onPress={() => handleChange(String(amt))}
              className="rounded-pill px-3 py-1.5"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <ThemedText variant="caption" tone="secondary">
                {formatINRCompact(rupeesToPaise(amt))}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
