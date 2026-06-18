/**
 * INR money helpers. Internally everything is paise (integer). These helpers
 * convert and format using the Indian numbering system (lakh/crore).
 */

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);
export const paiseToRupees = (paise: number): number => paise / 100;

const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

/** ₹1,25,000 — full precision with Indian grouping. */
export function formatINR(paise: number): string {
  return `₹${inrFormatter.format(Math.round(paiseToRupees(paise)))}`;
}

/**
 * Compact, human-friendly: ₹1.25L, ₹2.4Cr, ₹8,000.
 * Great for hero numbers and cards where space is tight.
 */
export function formatINRCompact(paise: number): string {
  const rupees = paiseToRupees(paise);
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';

  if (abs >= 1_00_00_000) {
    return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${trim(abs / 1_00_000)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${trim(abs / 1_000)}K`;
  }
  return `${sign}₹${inrFormatter.format(Math.round(abs))}`;
}

function trim(value: number): string {
  // One decimal, but drop a trailing ".0".
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/** Parse a user-typed rupee string ("80,000" / "₹1.2L") into paise. Best effort. */
export function parseRupeeInput(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, '').toLowerCase();
  if (!cleaned) return 0;
  if (cleaned.endsWith('cr')) return rupeesToPaise(parseFloat(cleaned) * 1_00_00_000);
  if (cleaned.endsWith('l')) return rupeesToPaise(parseFloat(cleaned) * 1_00_000);
  if (cleaned.endsWith('k')) return rupeesToPaise(parseFloat(cleaned) * 1_000);
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? rupeesToPaise(n) : 0;
}

export const formatPct = (value: number, digits = 0): string => `${value.toFixed(digits)}%`;
