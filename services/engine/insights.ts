/**
 * Insights engine (deterministic).
 *
 * Generates personalized, quantified insights from the user's financial state
 * and scores — spending, savings, salary, wealth, behavior, and forecasts.
 * Each insight is a headline + body + sentiment the UI can color and (later)
 * the coach can expand on. No numbers are invented by the AI.
 */

import type { AIContext, Insight } from '@/types';
import { formatINRCompact } from '@/utils/currency';
import { monthsToTarget } from '@/utils/finance';

function insight(
  id: string,
  theme: Insight['theme'],
  headline: string,
  body: string,
  sentiment: Insight['sentiment'],
  series?: Insight['series'],
): Insight {
  return { id, theme, headline, body, sentiment, series, createdAt: new Date().toISOString() };
}

export function generateInsights(context: AIContext): Insight[] {
  const { financials, investments, goals, expenses } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);
  const out: Insight[] = [];

  // Savings rate.
  const savingsRate = Math.round((financials.monthlySurplusPaise / income) * 100);
  out.push(
    insight(
      'savings-rate',
      'savings',
      `You keep ${savingsRate}% of your income`,
      savingsRate >= 30
        ? 'That is an excellent savings rate. Keep it above 30% and your goals stay comfortably on track.'
        : savingsRate >= 15
          ? 'A solid rate. Nudging this toward 30% would visibly speed up every goal.'
          : 'This is below the 20% mark. Trimming discretionary spend is the fastest way to lift it.',
      savingsRate >= 20 ? 1 : -1,
    ),
  );

  // Lifestyle inflation flag (discretionary share).
  const discretionary = expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amountPaise, 0);
  const discretionaryPct = Math.round((discretionary / income) * 100);
  if (discretionaryPct >= 20) {
    out.push(
      insight(
        'lifestyle',
        'behavior',
        `Discretionary spend is ${discretionaryPct}% of income`,
        `Capping non-essential spending protects your future self from lifestyle inflation. Even a 5% trim compounds into lakhs over a decade.`,
        -1,
      ),
    );
  }

  // Emergency fund.
  const monthlyEssential = Math.max(1, financials.totalExpensesPaise);
  const monthsCovered = financials.emergencyFundPaise / monthlyEssential;
  if (monthsCovered < financials.emergencyMonthsTarget) {
    const gap = financials.emergencyMonthsTarget - monthsCovered;
    out.push(
      insight(
        'emergency',
        'forecast',
        `Your safety net covers ${monthsCovered.toFixed(1)} months`,
        `You are ${gap.toFixed(1)} months short of your ${financials.emergencyMonthsTarget}-month target. Closing this gap should come before new investing risk.`,
        monthsCovered >= financials.emergencyMonthsTarget * 0.7 ? 0 : -1,
      ),
    );
  } else {
    out.push(
      insight(
        'emergency',
        'forecast',
        'Your emergency fund is fully funded',
        'You can cover your essential expenses without income for your full target period — a huge stress reducer.',
        1,
      ),
    );
  }

  // Investing rate.
  const sipTotal = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);
  const sipRate = Math.round((sipTotal / income) * 100);
  out.push(
    insight(
      'investing',
      'wealth',
      `You invest ${formatINRCompact(sipTotal)}/mo (${sipRate}% of income)`,
      sipRate >= 20
        ? 'Strong, disciplined investing. This consistency is what builds real wealth over time.'
        : 'Automating a higher monthly SIP is the single most reliable way to grow your net worth.',
      sipRate >= 15 ? 1 : 0,
    ),
  );

  // Goal acceleration opportunity.
  const topGoal = goals
    .filter((g) => g.status !== 'achieved' && g.type !== 'emergency')
    .sort((a, b) => a.priority - b.priority)[0];
  if (topGoal) {
    const surplus = Math.max(0, financials.monthlySurplusPaise);
    const base = monthsToTarget(
      topGoal.targetAmountPaise,
      topGoal.currentAmountPaise,
      Math.max(1, topGoal.monthlyContributionPaise),
      financials.assumptions.expectedReturnEquityPct,
    );
    const boost = Math.round(surplus * 0.25);
    const faster = monthsToTarget(
      topGoal.targetAmountPaise,
      topGoal.currentAmountPaise,
      Math.max(1, topGoal.monthlyContributionPaise) + boost,
      financials.assumptions.expectedReturnEquityPct,
    );
    const saved = base - faster;
    if (saved >= 2 && boost > 0) {
      out.push(
        insight(
          'goal-accel',
          'salary',
          `Reach ${topGoal.name} ${Math.round(saved)} months sooner`,
          `Adding ${formatINRCompact(boost)}/mo from your surplus pulls this goal forward by roughly ${Math.round(saved)} months.`,
          1,
        ),
      );
    }
  }

  return out;
}
