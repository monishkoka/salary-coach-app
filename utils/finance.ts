/**
 * Pure financial math. Works in paise where money is involved. No side effects.
 */

/** Future value of a monthly SIP given an annual return %. */
export function sipFutureValue(
  monthlyPaise: number,
  annualReturnPct: number,
  months: number,
): number {
  if (months <= 0) return 0;
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return monthlyPaise * months;
  const fv = monthlyPaise * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  return Math.round(fv);
}

/** Future value of a lump sum compounded annually. */
export function lumpSumFutureValue(
  principalPaise: number,
  annualReturnPct: number,
  months: number,
): number {
  const r = annualReturnPct / 100 / 12;
  return Math.round(principalPaise * Math.pow(1 + r, months));
}

/** Months required for a SIP to reach a target, given a starting corpus. */
export function monthsToTarget(
  targetPaise: number,
  startingPaise: number,
  monthlyPaise: number,
  annualReturnPct: number,
  maxMonths = 600,
): number {
  if (monthlyPaise <= 0 && startingPaise >= targetPaise) return 0;
  const r = annualReturnPct / 100 / 12;
  let corpus = startingPaise;
  for (let m = 1; m <= maxMonths; m += 1) {
    corpus = corpus * (1 + r) + monthlyPaise;
    if (corpus >= targetPaise) return m;
  }
  return maxMonths;
}

/** EMI for a loan: principal, annual rate %, months. */
export function emi(principalPaise: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principalPaise / months);
  const e =
    (principalPaise * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(e);
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const pct = (part: number, whole: number): number =>
  whole <= 0 ? 0 : clamp((part / whole) * 100, 0, 100);
