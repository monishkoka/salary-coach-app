/** Lightweight date helpers (no external date lib to keep the bundle lean). */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatMonthYear(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Days until the next occurrence of `dayOfMonth` (e.g. payday). */
export function daysUntilDayOfMonth(dayOfMonth: number, from: Date = new Date()): number {
  const today = from.getDate();
  const ref = new Date(from);
  if (dayOfMonth > today) {
    ref.setDate(dayOfMonth);
  } else {
    ref.setMonth(ref.getMonth() + 1);
    ref.setDate(dayOfMonth);
  }
  const ms = ref.setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Add N months to today and return an ISO date string (YYYY-MM-DD). */
export function addMonthsISO(months: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function monthsBetween(from: string | Date, to: string | Date): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.max(
    0,
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()),
  );
}

export function currentPeriodStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
