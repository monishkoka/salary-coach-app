/** Tiny classnames joiner for conditional NativeWind className strings. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
