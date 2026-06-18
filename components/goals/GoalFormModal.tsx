import { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/layout/ThemedText';
import { Button } from '@/components/buttons/Button';
import { CurrencyField } from '@/components/forms/CurrencyField';
import { useTheme } from '@/hooks/useTheme';
import type { Goal } from '@/types';
import { addMonthsISO } from '@/utils/date';

interface GoalFormModalProps {
  visible: boolean;
  initial?: Goal | null;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  onDelete?: (id: string) => void;
}

export function GoalFormModal({ visible, initial, onClose, onSave, onDelete }: GoalFormModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(0);
  const [current, setCurrent] = useState(0);
  const [months, setMonths] = useState(24);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setTarget(initial?.targetAmountPaise ?? 0);
      setCurrent(initial?.currentAmountPaise ?? 0);
      setMonths(24);
    }
  }, [visible, initial]);

  const save = () => {
    if (!name.trim() || target <= 0) return;
    const monthly = Math.max(0, Math.round((target - current) / months));
    onSave({
      id: initial?.id ?? `goal-${Date.now()}`,
      userId: initial?.userId ?? 'local',
      type: initial?.type ?? 'custom',
      name: name.trim(),
      icon: initial?.icon ?? '🎯',
      targetAmountPaise: target,
      currentAmountPaise: current,
      targetDate: initial?.targetDate ?? addMonthsISO(months),
      priority: initial?.priority ?? 99,
      monthlyContributionPaise: monthly,
      probabilityOfSuccess: initial?.probabilityOfSuccess ?? null,
      status: 'on_track',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <Pressable
          className="rounded-t-card p-5 pb-10"
          style={{ backgroundColor: colors.background }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-4 items-center">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <ThemedText variant="heading" className="mb-4">
            {initial ? 'Edit goal' : 'New goal'}
          </ThemedText>

          <ThemedText variant="label" tone="secondary" className="mb-2">
            Goal name
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Down payment"
            placeholderTextColor={colors.textTertiary}
            className="mb-4 h-14 rounded-2xl px-4 text-base"
            style={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderWidth: 1.5,
              borderColor: colors.border,
            }}
          />

          <CurrencyField label="Target amount" valuePaise={target} onChangePaise={setTarget} />
          <CurrencyField label="Already saved" valuePaise={current} onChangePaise={setCurrent} />

          <View className="mt-2">
            <Button label={initial ? 'Save changes' : 'Create goal'} onPress={save} />
            {initial && onDelete ? (
              <View className="mt-3">
                <Button
                  label="Delete goal"
                  variant="danger"
                  onPress={() => {
                    onDelete(initial.id);
                    onClose();
                  }}
                />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
