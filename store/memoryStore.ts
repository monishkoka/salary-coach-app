/**
 * Financial Memory store — persists a monthly snapshot of the user's vitals so
 * the coach can reference real history over time ("3 months ago you saved 12%,
 * today 21%"). Snapshots are append-only, one per calendar month (the current
 * month is upserted as the picture changes).
 *
 * In demo/mock mode we seed a few months of plausible improving history so the
 * memory feature is demonstrable from first launch.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinancialSnapshot, MemoryNarrative } from '@/types';
import { buildSnapshot, buildMemoryNarrative } from '@/services/engine';
import { config } from '@/constants/config';
import { useProfileStore } from './profileStore';

interface MemoryState {
  snapshots: FinancialSnapshot[];
  seeded: boolean;
  /** Capture / refresh the current month's snapshot from the live profile. */
  recordSnapshot: () => void;
  /** Longitudinal narrative grounded in history vs the current state. */
  narrative: () => MemoryNarrative | null;
  reset: () => void;
}

function shiftMonth(base: Date, deltaMonths: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + deltaMonths, 1);
  return d.toISOString().slice(0, 7);
}

/**
 * Build a believable improving back-history from the current snapshot so the
 * memory feature has something truthful-feeling to narrate in demos. Each step
 * back scales down the positive metrics so "today" reads as progress.
 */
function seedHistory(current: FinancialSnapshot): FinancialSnapshot[] {
  const now = new Date();
  const steps = [
    { delta: -3, f: 0.55 },
    { delta: -2, f: 0.7 },
    { delta: -1, f: 0.85 },
  ];
  return steps.map(({ delta, f }) => ({
    ...current,
    month: shiftMonth(now, delta),
    capturedAt: new Date(now.getFullYear(), now.getMonth() + delta, 1).toISOString(),
    healthScore: Math.round(current.healthScore * f),
    velocityScore: Math.round(current.velocityScore * f),
    savingsRatePct: Math.max(0, Math.round(current.savingsRatePct * f)),
    sipRatePct: Math.max(0, Math.round(current.sipRatePct * f)),
    netWorthPaise: Math.round(current.netWorthPaise * (0.6 + f * 0.4)),
    totalDebtPaise: Math.round(current.totalDebtPaise * (2 - f)),
    goalsOnTrack: Math.max(0, current.goalsOnTrack - 1),
  }));
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      seeded: false,

      recordSnapshot: () => {
        const ctx = useProfileStore.getState().getContext();
        if (!ctx) return;
        const snap = buildSnapshot(ctx);

        const existing = get().snapshots.filter((s) => s.month !== snap.month);
        let next = [...existing, snap].sort((a, b) => a.month.localeCompare(b.month));

        // First run in demo mode: seed a few months of prior history so the
        // memory narrative has a real trajectory to reference.
        if (!get().seeded && config.useMockData && existing.length === 0) {
          next = [...seedHistory(snap), snap].sort((a, b) => a.month.localeCompare(b.month));
          set({ seeded: true });
        }

        // Keep the trailing 24 months at most.
        set({ snapshots: next.slice(-24) });
      },

      narrative: () => {
        const ctx = useProfileStore.getState().getContext();
        if (!ctx) return null;
        const current = buildSnapshot(ctx);
        return buildMemoryNarrative(get().snapshots, current);
      },

      reset: () => set({ snapshots: [], seeded: false }),
    }),
    {
      name: 'sc:memory',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ snapshots: state.snapshots, seeded: state.seeded }),
    },
  ),
);
