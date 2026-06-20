import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { ThemedText } from '@/components/layout/ThemedText';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { Card } from '@/components/cards/Card';
import { ScoreCard } from '@/components/cards/ScoreCard';
import { AllocationCard } from '@/components/cards/AllocationCard';
import { GoalCard } from '@/components/cards/GoalCard';
import { EmergencyFundCard } from '@/components/cards/EmergencyFundCard';
import { HighlightCard } from '@/components/cards/HighlightCard';
import { ActionItemCard } from '@/components/cards/ActionItemCard';
import { VelocityDial } from '@/components/charts/VelocityDial';
import { ProjectionChart } from '@/components/charts/ProjectionChart';
import { LoadingState } from '@/components/layout/States';
import { palette } from '@/constants/theme';
import { useProfileStore } from '@/store/profileStore';
import { useBlueprintStore } from '@/store/blueprintStore';
import { useStreakStore } from '@/store/streakStore';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';
import { useHaptics } from '@/hooks/useHaptics';
import { useScreenView } from '@/hooks/useScreenView';
import { useTheme } from '@/hooks/useTheme';
import { formatINR, formatINRCompact } from '@/utils/currency';
import { daysUntilDayOfMonth } from '@/utils/date';

const HORIZON_LABELS = ['Now', '1y', '3y', '5y', '10y'];

export default function Home() {
  const user = useProfileStore((s) => s.user);
  const financials = useProfileStore((s) => s.financials);
  const goals = useProfileStore((s) => s.goals);
  const expenses = useProfileStore((s) => s.expenses);
  const scores = useProfileStore((s) => s.scores);
  const loaded = useProfileStore((s) => s.loaded);
  const recomputeScores = useProfileStore((s) => s.recomputeScores);
  const refresh = useProfileStore((s) => s.refresh);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const generate = useBlueprintStore((s) => s.generate);
  const completed = useBlueprintStore((s) => s.completed);
  const toggleAction = useBlueprintStore((s) => s.toggleAction);
  const streak = useStreakStore((s) => s.currentStreak);
  const plan = useFinancialPlan();
  const haptics = useHaptics();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  useScreenView('home');

  useEffect(() => {
    if (loaded && !blueprint) generate();
  }, [loaded, blueprint, generate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      // Pull the latest data from the backend (no-op fetch in mock mode), then
      // recompute scores and regenerate the blueprint off the fresh picture.
      await refresh();
      recomputeScores();
      generate();
    } finally {
      setRefreshing(false);
    }
  }, [refresh, recomputeScores, generate, haptics]);

  if (!loaded || !user || !financials) return <LoadingState label="Loading your finances…" />;

  const daysToPayday = user.payDayOfMonth ? daysUntilDayOfMonth(user.payDayOfMonth) : null;
  const isPayday = daysToPayday === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const currentScenario = plan?.scenarios.find((s) => s.id === 'current');
  const projectionPoints = currentScenario?.points.map((p) => p.netWorthPaise) ?? [];
  const topAction = plan?.actionPlan.items[0];

  // Emergency runway is measured against essential spend, not total spend.
  const essentialMonthly =
    expenses.filter((e) => e.isEssential).reduce((s, e) => s + e.amountPaise, 0) ||
    financials.totalExpensesPaise;

  return (
    <Screen
      contentClassName="px-5 pb-28"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Mission-control hero: salary + payday command */}
      <LinearGradient
        colors={[palette.brand[600], palette.brand[400]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 20, marginTop: 8 }}
      >
        <ThemedText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {greeting}, {user.displayName?.split(' ')[0] || 'there'} 👋
        </ThemedText>
        <View className="mt-3 flex-row items-end">
          <ThemedText variant="title" style={{ color: '#FFFFFF' }}>
            {formatINR(financials.monthlyIncomePaise)}
          </ThemedText>
          <ThemedText variant="body" className="mb-1 ml-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            / month
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push('/payday')}
          style={{ marginTop: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Open payday plan"
        >
          <View
            className="flex-row items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          >
            <View className="flex-1">
              <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} className="font-semibold uppercase tracking-wider">
                {isPayday ? '🎉 Payday is here' : daysToPayday !== null ? `Payday in ${daysToPayday} days` : 'Your salary plan'}
              </ThemedText>
              <ThemedText variant="body" style={{ color: '#FFFFFF' }} className="mt-0.5 font-semibold">
                {isPayday
                  ? "See this month's plan"
                  : `${formatINRCompact(financials.monthlySurplusPaise)}/mo surplus to put to work`}
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      </LinearGradient>

      {/* Today's focus: the single highest-impact next action + habit streak */}
      {topAction ? (
        <Card className="mt-5">
          <View className="flex-row items-center justify-between">
            <ThemedText variant="label" tone="secondary">
              TODAY’S FOCUS
            </ThemedText>
            {streak > 0 ? (
              <View
                className="flex-row items-center rounded-full px-2.5 py-1"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <ThemedText className="text-xs">🔥</ThemedText>
                <ThemedText variant="caption" tone="accent" className="ml-1 font-semibold">
                  {streak}-day streak
                </ThemedText>
              </View>
            ) : null}
          </View>
          <Pressable
            className="mt-3 flex-row items-center"
            onPress={() => {
              if (!completed[topAction.id]) haptics.success();
              else haptics.light();
              toggleAction(topAction.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Mark "${topAction.title}" as done`}
          >
            <Ionicons
              name={completed[topAction.id] ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={completed[topAction.id] ? colors.positive : colors.textTertiary}
            />
            <View className="ml-3 flex-1">
              <ThemedText
                variant="body"
                className="font-semibold"
                style={completed[topAction.id] ? { textDecorationLine: 'line-through', color: colors.textTertiary } : undefined}
              >
                {topAction.title}
              </ThemedText>
              <ThemedText variant="caption" tone="accent" className="mt-0.5">
                {topAction.impactLabel}
              </ThemedText>
            </View>
          </Pressable>
        </Card>
      ) : null}

      {/* What's wrong + best move */}
      {plan?.actionPlan.biggestMistake || plan?.actionPlan.biggestOpportunity ? (
        <View className="mt-5 gap-3">
          {plan?.actionPlan.biggestMistake ? (
            <HighlightCard
              variant="mistake"
              title={plan.actionPlan.biggestMistake.title}
              body={plan.actionPlan.biggestMistake.body}
              badge={plan.actionPlan.biggestMistake.costLabel}
              onPress={() => router.push('/(tabs)/coach')}
            />
          ) : null}
          {plan?.actionPlan.biggestOpportunity ? (
            <HighlightCard
              variant="opportunity"
              title={plan.actionPlan.biggestOpportunity.title}
              body={plan.actionPlan.biggestOpportunity.body}
              badge={plan.actionPlan.biggestOpportunity.upsideLabel}
              onPress={() => router.push('/future-self')}
            />
          ) : null}
        </View>
      ) : null}

      {/* Health + Velocity command center */}
      <View className="mt-2">
        <ScoreCard
          title="FINANCIAL HEALTH"
          score={scores?.healthScore ?? 0}
          caption="out of 100"
          takeaway="Your overall financial strength right now. Tap to see the five drivers and your plan."
          onPress={() => router.push('/(tabs)/insights')}
        />
        <Card className="mt-4 items-center" onPress={() => router.push('/money-gps')}>
          <ThemedText variant="label" tone="secondary" className="self-start">
            WEALTH VELOCITY
          </ThemedText>
          <View className="my-2">
            <VelocityDial
              current={scores?.velocityScore ?? 0}
              recommended={plan?.moneyGps.recommended.velocityScore}
            />
          </View>
          <ThemedText variant="body" tone="secondary" className="text-center">
            {scores?.projectedFiDate
              ? `On pace for financial freedom by ${new Date(scores.projectedFiDate).getFullYear()}.`
              : 'How fast you’re moving toward financial independence.'}
          </ThemedText>
          <ThemedText variant="caption" tone="accent" className="mt-2">
            Open Money GPS →
          </ThemedText>
        </Card>
      </View>

      {/* AI Action Plan */}
      {plan && plan.actionPlan.items.length > 0 ? (
        <>
          <SectionHeader
            title="Your action plan"
            action={{ label: 'Ask Coach', onPress: () => router.push('/(tabs)/coach') }}
          />
          <View className="gap-3">
            {plan.actionPlan.items.slice(0, 3).map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                done={!!completed[item.id]}
                onToggle={() => {
                  if (!completed[item.id]) haptics.success();
                  else haptics.light();
                  toggleAction(item.id);
                }}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* Salary Blueprint */}
      <SectionHeader
        title="Your salary blueprint"
        action={{ label: 'Payday plan', onPress: () => router.push('/payday') }}
      />
      {blueprint ? <AllocationCard blueprint={blueprint} /> : null}

      {/* Future projection preview */}
      {projectionPoints.length > 0 ? (
        <>
          <SectionHeader
            title="Your future self"
            action={{ label: 'Simulate', onPress: () => router.push('/future-self') }}
          />
          <Card onPress={() => router.push('/future-self')}>
            <View className="flex-row items-end justify-between">
              <View>
                <ThemedText variant="caption" tone="secondary">
                  Projected net worth in 10 years
                </ThemedText>
                <ThemedText variant="title" tone="accent">
                  {formatINRCompact(currentScenario?.netWorthAt.y10 ?? 0)}
                </ThemedText>
              </View>
              <ThemedText variant="caption" tone="tertiary">
                on your current path
              </ThemedText>
            </View>
            <View className="mt-2">
              <ProjectionChart
                labels={HORIZON_LABELS}
                primary={{ label: 'Current path', points: projectionPoints }}
                height={150}
              />
            </View>
          </Card>
        </>
      ) : null}

      {/* Emergency fund */}
      <SectionHeader title="Emergency fund" />
      <EmergencyFundCard
        currentPaise={financials.emergencyFundPaise}
        monthlyEssentialPaise={essentialMonthly}
        targetMonths={financials.emergencyMonthsTarget}
      />

      {/* Goals */}
      <SectionHeader
        title="Goals"
        action={goals.length > 0 ? { label: 'See all', onPress: () => router.push('/(tabs)/goals') } : undefined}
      />
      {goals.length > 0 ? (
        <View className="gap-3">
          {goals.slice(0, 2).map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => router.push('/(tabs)/goals')} />
          ))}
        </View>
      ) : (
        <Card onPress={() => router.push('/(tabs)/goals')}>
          <View className="flex-row items-center">
            <ThemedText className="text-2xl">🎯</ThemedText>
            <View className="ml-3 flex-1">
              <ThemedText variant="body" className="font-semibold">
                Set your first goal
              </ThemedText>
              <ThemedText variant="caption" tone="secondary" className="mt-0.5">
                A home, a car, a trip — we'll build the plan to get you there.
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      )}

      {/* Coach prompt */}
      <Card className="mt-6 items-center" onPress={() => router.push('/(tabs)/coach')}>
        <ThemedText className="text-2xl">✨</ThemedText>
        <ThemedText variant="body" className="mt-2 text-center font-semibold">
          Ask your Coach anything about your money
        </ThemedText>
        <ThemedText variant="caption" tone="secondary" className="mt-1 text-center" style={{ color: colors.textSecondary }}>
          “Can I afford a car?” · “How much should I invest?”
        </ThemedText>
      </Card>
    </Screen>
  );
}
