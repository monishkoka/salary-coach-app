/**
 * Financial Memory engine (deterministic).
 *
 * The app captures a monthly snapshot of the user's key financial vitals. This
 * module turns that history into a personal narrative the coach can reference —
 * e.g. "Three months ago you were saving 12%. Today you are saving 21%." — so
 * the product feels like it actually knows the user over time.
 *
 * Pure functions only. History comes from store/memoryStore.
 */

import type { AIContext, FinancialSnapshot, MemoryNarrative, MemoryTrend } from '@/types';
import { formatINRCompact } from '@/utils/currency';

const monthKey = (d: Date = new Date()): string => d.toISOString().slice(0, 7);

/** Capture the current financial vitals as a snapshot for this calendar month. */
export function buildSnapshot(context: AIContext): FinancialSnapshot {
  const { financials, scores, investments, debts, goals } = context;
  const income = Math.max(1, financials.monthlyIncomePaise);
  const monthlyEssential = Math.max(1, financials.totalExpensesPaise);
  const sipTotal = investments.reduce((s, i) => s + (i.sipAmountPaise ?? 0), 0);

  return {
    month: monthKey(),
    capturedAt: new Date().toISOString(),
    healthScore: scores?.healthScore ?? 0,
    velocityScore: scores?.velocityScore ?? 0,
    savingsRatePct: Math.round((financials.monthlySurplusPaise / income) * 100),
    sipRatePct: Math.round((sipTotal / income) * 100),
    netWorthPaise: financials.netWorthPaise,
    emergencyMonths: Math.round((financials.emergencyFundPaise / monthlyEssential) * 10) / 10,
    totalDebtPaise: debts.reduce((s, d) => s + d.principalOutstandingPaise, 0),
    goalsOnTrack: goals.filter((g) => g.status === 'on_track' || g.status === 'achieved').length,
  };
}

/**
 * Months of elapsed history between the earliest snapshot and now. Snapshots are
 * keyed YYYY-MM, so we diff the calendar months.
 */
function spanFromHistory(history: FinancialSnapshot[]): number {
  if (history.length < 2) return 0;
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const [a, b] = [sorted[0]!.month, sorted[sorted.length - 1]!.month];
  const [ay, am] = a.split('-').map(Number) as [number, number];
  const [by, bm] = b.split('-').map(Number) as [number, number];
  return (by - ay) * 12 + (bm - am);
}

/**
 * Build a longitudinal narrative grounded in the snapshot history vs the current
 * state. Returns null when there isn't enough history to say anything truthful.
 */
export function buildMemoryNarrative(
  history: FinancialSnapshot[],
  current: FinancialSnapshot,
): MemoryNarrative | null {
  // Only consider snapshots strictly before the current month.
  const past = history
    .filter((s) => s.month < current.month)
    .sort((a, b) => a.month.localeCompare(b.month));
  if (past.length === 0) return null;

  const earliest = past[0]!;
  const span = spanFromHistory([...past, current]);
  const spanLabel = span <= 1 ? 'last month' : `${span} months ago`;

  const details: string[] = [];
  let positives = 0;
  let negatives = 0;

  // Savings rate movement (the headline habit).
  const savingsDelta = current.savingsRatePct - earliest.savingsRatePct;
  if (Math.abs(savingsDelta) >= 2) {
    if (savingsDelta > 0) positives += 1;
    else negatives += 1;
    details.push(
      `${spanLabel} you were saving ${earliest.savingsRatePct}% of your income; today you're saving ${current.savingsRatePct}%.`,
    );
  }

  // Investing discipline.
  const sipDelta = current.sipRatePct - earliest.sipRatePct;
  if (Math.abs(sipDelta) >= 2) {
    if (sipDelta > 0) positives += 1;
    else negatives += 1;
    details.push(
      sipDelta > 0
        ? `Your investing rate climbed from ${earliest.sipRatePct}% to ${current.sipRatePct}% of income.`
        : `Your investing rate slipped from ${earliest.sipRatePct}% to ${current.sipRatePct}% of income.`,
    );
  }

  // Net worth trajectory.
  const nwDelta = current.netWorthPaise - earliest.netWorthPaise;
  if (Math.abs(nwDelta) >= 100000) {
    if (nwDelta > 0) positives += 1;
    else negatives += 1;
    details.push(
      nwDelta > 0
        ? `Your net worth grew by ${formatINRCompact(nwDelta)} over this period.`
        : `Your net worth fell by ${formatINRCompact(Math.abs(nwDelta))} — worth a closer look.`,
    );
  }

  // Debt paydown.
  const debtDelta = current.totalDebtPaise - earliest.totalDebtPaise;
  if (debtDelta < -50000) {
    positives += 1;
    details.push(`You've paid down ${formatINRCompact(Math.abs(debtDelta))} of debt.`);
  }

  // Health score movement.
  const healthDelta = current.healthScore - earliest.healthScore;
  if (Math.abs(healthDelta) >= 4) {
    if (healthDelta > 0) positives += 1;
    else negatives += 1;
    details.push(
      healthDelta > 0
        ? `Your Financial Health Score is up ${healthDelta} points to ${current.healthScore}.`
        : `Your Financial Health Score dipped ${Math.abs(healthDelta)} points to ${current.healthScore}.`,
    );
  }

  if (details.length === 0) {
    return {
      headline: `Your finances have held steady over the last ${Math.max(1, span)} month${span === 1 ? '' : 's'}.`,
      details: ['Consistency is underrated — steady habits are exactly what compound.'],
      trend: 'steady',
      spanMonths: span,
    };
  }

  const trend: MemoryTrend = positives > negatives ? 'improving' : negatives > positives ? 'slipping' : 'steady';
  const headline =
    trend === 'improving'
      ? 'Your consistency has improved significantly.'
      : trend === 'slipping'
        ? "A few habits have drifted — let's tighten them back up."
        : 'You’ve stayed remarkably consistent.';

  return { headline, details, trend, spanMonths: span };
}
