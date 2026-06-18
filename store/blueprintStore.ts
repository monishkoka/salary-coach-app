import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SalaryBlueprint } from '@/types';
import { generateBlueprint } from '@/services/engine';
import { currentPeriodStart } from '@/utils/date';
import { useProfileStore } from './profileStore';
import { analytics } from '@/services/analytics';

interface BlueprintState {
  blueprint: SalaryBlueprint | null;
  generating: boolean;
  /** Allocation keys the user has marked as "done" this cycle (North Star). */
  completed: Record<string, boolean>;
  generate: () => void;
  toggleAction: (key: string) => void;
  completionPct: () => number;
  reset: () => void;
}

export const useBlueprintStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      blueprint: null,
      generating: false,
      completed: {},

      generate: () => {
        const ctx = useProfileStore.getState().getContext();
        if (!ctx) return;
        const periodStart = currentPeriodStart();
        // Preserve completed-action progress within the same pay cycle; only
        // reset it when a fresh cycle starts (this is the North Star metric).
        const samePeriod = get().blueprint?.periodStart === periodStart;
        const result = generateBlueprint(ctx, periodStart);
        set({
          generating: false,
          blueprint: { id: 'bp-local', userId: ctx.profile.id, ...result },
          completed: samePeriod ? get().completed : {},
        });
        analytics.track('blueprint_generated', { income: ctx.financials.monthlyIncomePaise });
      },

      toggleAction: (key) => {
        const completed = { ...get().completed, [key]: !get().completed[key] };
        set({ completed });
        if (completed[key]) analytics.track('recommendation_executed', { key });
      },

      completionPct: () => {
        const bp = get().blueprint;
        if (!bp) return 0;
        const actionable = bp.allocations.filter((a) => a.amountPaise > 0);
        if (actionable.length === 0) return 0;
        const done = actionable.filter((a) => get().completed[a.key]).length;
        return Math.round((done / actionable.length) * 100);
      },

      reset: () => set({ blueprint: null, completed: {}, generating: false }),
    }),
    {
      name: 'sc:blueprint',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ blueprint: state.blueprint, completed: state.completed }),
    },
  ),
);
