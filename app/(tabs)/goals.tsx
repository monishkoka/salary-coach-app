import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { GoalCard } from '@/components/cards/GoalCard';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/buttons/Button';
import { EmptyState } from '@/components/layout/States';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { useProfileStore } from '@/store/profileStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/hooks/useTheme';
import { analytics } from '@/services/analytics';
import { formatINRCompact } from '@/utils/currency';
import { monthsToTarget } from '@/utils/finance';
import { addMonthsISO, formatMonthYear } from '@/utils/date';
import type { Goal } from '@/types';

function PlannerTile({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card className="flex-1" onPress={onPress}>
      <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: colors.accentSoft }}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <ThemedText variant="body" className="mt-2 font-semibold">
        {title}
      </ThemedText>
      <ThemedText variant="caption" tone="secondary" className="mt-0.5">
        {subtitle}
      </ThemedText>
    </Card>
  );
}

export default function Goals() {
  const goals = useProfileStore((s) => s.goals);
  const financials = useProfileStore((s) => s.financials);
  const addGoal = useProfileStore((s) => s.addGoal);
  const updateGoal = useProfileStore((s) => s.updateGoal);
  const removeGoal = useProfileStore((s) => s.removeGoal);
  const maxGoals = useSubscriptionStore((s) => s.entitlements.maxActiveGoals);
  const haptics = useHaptics();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [selected, setSelected] = useState<Goal | null>(null);

  const openNew = () => {
    if (goals.length >= maxGoals) {
      analytics.track('feature_locked_hit', { feature: 'unlimited_goals' });
      router.push('/paywall');
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setModalOpen(true);
  };

  const baseContribution = (goal: Goal) =>
    goal.monthlyContributionPaise || Math.round((financials?.monthlySurplusPaise ?? 0) * 0.3);

  const forecastMonths = (goal: Goal) =>
    monthsToTarget(goal.targetAmountPaise, goal.currentAmountPaise, baseContribution(goal), 11);

  /** A realistic "what if I add a bit more" nudge: the extra/mo and months saved. */
  const speedup = (goal: Goal, baseMonths: number) => {
    const surplus = financials?.monthlySurplusPaise ?? 0;
    const extra = Math.max(100000, Math.round(surplus * 0.2)); // ≥ ₹1,000/mo
    const faster = monthsToTarget(
      goal.targetAmountPaise,
      goal.currentAmountPaise,
      baseContribution(goal) + extra,
      11,
    );
    return { extra, monthsSooner: Math.max(0, baseMonths - faster) };
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <ThemedText variant="title">Plan</ThemedText>
        <Pressable
          onPress={openNew}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Add a new goal"
        >
          <ThemedText variant="heading" tone="accent">
            ＋
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText variant="body" tone="secondary" className="mt-1">
        Your goals, funded in priority order.
      </ThemedText>

      {/* Forward-looking planning surfaces */}
      <View className="mt-4 flex-row gap-3">
        <PlannerTile
          icon="navigate"
          title="Money GPS"
          subtitle="Your route to every goal"
          onPress={() => router.push('/money-gps')}
        />
        <PlannerTile
          icon="trending-up"
          title="Future Self"
          subtitle="Simulate your decisions"
          onPress={() => router.push('/future-self')}
        />
      </View>

      <SectionHeader title="Your goals" />

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          body="Add your first goal — a home, a car, a trip — and we’ll build a plan to get you there."
          cta={{ label: 'Add a goal', onPress: openNew }}
        />
      ) : (
        <View className="mt-4 gap-3">
          {goals.map((goal) => {
            const months = forecastMonths(goal);
            return (
              <View key={goal.id}>
                <GoalCard goal={goal} onPress={() => setSelected(selected?.id === goal.id ? null : goal)} />
                {selected?.id === goal.id ? (
                  <Card inset className="mt-2">
                    <View className="flex-row justify-between">
                      <ThemedText variant="caption" tone="secondary">
                        Monthly contribution
                      </ThemedText>
                      <ThemedText variant="caption">
                        {formatINRCompact(goal.monthlyContributionPaise)}
                      </ThemedText>
                    </View>
                    <View className="mt-1 flex-row justify-between">
                      <ThemedText variant="caption" tone="secondary">
                        Estimated completion
                      </ThemedText>
                      <ThemedText variant="caption">
                        {formatMonthYear(addMonthsISO(months))} ({(months / 12).toFixed(1)} yrs)
                      </ThemedText>
                    </View>
                    {goal.probabilityOfSuccess != null ? (
                      <View className="mt-1 flex-row justify-between">
                        <ThemedText variant="caption" tone="secondary">
                          Probability of success
                        </ThemedText>
                        <ThemedText variant="caption">{goal.probabilityOfSuccess}%</ThemedText>
                      </View>
                    ) : null}
                    {(() => {
                      const { extra, monthsSooner } = speedup(goal, months);
                      if (monthsSooner < 1) return null;
                      return (
                        <ThemedText variant="caption" tone="accent" className="mt-2">
                          💡 Adding {formatINRCompact(extra)}/month could reach this goal about{' '}
                          {monthsSooner} month{monthsSooner === 1 ? '' : 's'} sooner.
                        </ThemedText>
                      );
                    })()}
                    <View className="mt-3">
                      <Button label="Edit goal" variant="ghost" onPress={() => openEdit(goal)} />
                    </View>
                  </Card>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <GoalFormModal
        visible={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={(goal) => {
          if (editing) {
            updateGoal(goal.id, goal);
            analytics.track('goal_updated', { id: goal.id });
          } else {
            addGoal(goal);
            analytics.track('goal_created', { id: goal.id });
          }
          haptics.success();
        }}
        onDelete={(id) => {
          removeGoal(id);
          haptics.warning();
        }}
      />
    </Screen>
  );
}
