import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { ThemedText } from '@/components/layout/ThemedText';
import { useTheme } from '@/hooks/useTheme';

interface TextFieldProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  helper?: string;
}

/** React Hook Form-bound text input with label, error and theming. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  helper,
  ...rest
}: TextFieldProps<T>) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const { field, fieldState } = useController({ control, name });
  const error = fieldState.error?.message;

  return (
    <View className="mb-4">
      {label ? (
        <ThemedText variant="label" tone="secondary" className="mb-2">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        value={field.value?.toString() ?? ''}
        onChangeText={field.onChange}
        onBlur={() => {
          field.onBlur();
          setFocused(false);
        }}
        onFocus={() => setFocused(true)}
        placeholderTextColor={colors.textTertiary}
        className="h-14 rounded-2xl px-4 text-base"
        style={{
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          borderWidth: 1.5,
          borderColor: error ? colors.risk : focused ? colors.accent : colors.border,
        }}
        {...rest}
      />
      {error ? (
        <ThemedText variant="caption" className="mt-1" style={{ color: colors.risk }}>
          {error}
        </ThemedText>
      ) : helper ? (
        <ThemedText variant="caption" tone="tertiary" className="mt-1">
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}
