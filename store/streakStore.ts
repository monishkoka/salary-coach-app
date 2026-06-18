import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from '@/services/analytics';

/**
 * Daily check-in streak — the core habit-formation loop.
 *
 * Financial outcomes come from repeated small actions, so we reward the user
 * for showing up. A streak counter (Duolingo/Apple-Fitness style) turns "open
 * the app on payday" into "open the app daily", which is the single strongest
 * driver of long-term retention and of the North Star (decisions executed).
 */
interface StreakState {
  /** ISO date (YYYY-MM-DD) of the last check-in, or null if never. */
  lastCheckIn: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  /** Set true on the launch where the streak advanced (drives a celebration). */
  advancedToday: boolean;
  checkIn: () => void;
  reset: () => void;
}

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);
const diffInDays = (a: string, b: string): number => {
  const ms = new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
};

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      lastCheckIn: null,
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      advancedToday: false,

      checkIn: () => {
        const today = dayKey(new Date());
        const { lastCheckIn, currentStreak, longestStreak, totalCheckIns } = get();

        if (lastCheckIn === today) {
          // Already checked in today — nothing changes.
          if (get().advancedToday) set({ advancedToday: false });
          return;
        }

        const gap = lastCheckIn ? diffInDays(today, lastCheckIn) : null;
        // Consecutive day continues the streak; any longer gap resets it.
        const next = gap === 1 ? currentStreak + 1 : 1;

        set({
          lastCheckIn: today,
          currentStreak: next,
          longestStreak: Math.max(longestStreak, next),
          totalCheckIns: totalCheckIns + 1,
          advancedToday: true,
        });

        analytics.track('daily_checkin', { streak: next });
        if (next > 1) analytics.track('streak_extended', { streak: next });
      },

      reset: () =>
        set({
          lastCheckIn: null,
          currentStreak: 0,
          longestStreak: 0,
          totalCheckIns: 0,
          advancedToday: false,
        }),
    }),
    { name: 'sc:streak', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
