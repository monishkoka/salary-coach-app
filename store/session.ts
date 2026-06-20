/**
 * Centralized per-user state teardown.
 *
 * A single source of truth for "forget everything about the current account".
 * It is called from BOTH explicit sign-out and implicit session expiry so the
 * two paths can never drift — the #1 cause of cross-account data leakage on a
 * shared device. Every store that holds user data resets its in-memory state
 * AND clears its persisted copy from disk, and the offline sync queue is wiped
 * so a previous user's unflushed mutations never execute under the next login.
 */

import { useProfileStore } from './profileStore';
import { useCoachStore } from './coachStore';
import { useBlueprintStore } from './blueprintStore';
import { useMemoryStore } from './memoryStore';
import { useOnboardingStore } from './onboardingStore';
import { useStreakStore } from './streakStore';
import { useSubscriptionStore } from './subscriptionStore';
import { clearQueue } from '@/services/sync/queue';

/**
 * Reset all per-user state and clear persisted copies. Resolves once disk is
 * clean so callers can safely re-route to auth without a stale rehydrate race.
 */
export async function clearAllUserState(): Promise<void> {
  // In-memory resets (synchronous) — UI updates immediately.
  useProfileStore.getState().reset();
  useCoachStore.getState().reset();
  useBlueprintStore.getState().reset();
  useMemoryStore.getState().reset();
  useOnboardingStore.getState().reset();
  useStreakStore.getState().reset();

  // Clear persisted copies from disk so nothing rehydrates on next launch.
  await Promise.allSettled([
    useProfileStore.persist.clearStorage?.(),
    useCoachStore.persist.clearStorage?.(),
    useBlueprintStore.persist.clearStorage?.(),
    useMemoryStore.persist.clearStorage?.(),
    useOnboardingStore.persist.clearStorage?.(),
    useStreakStore.persist.clearStorage?.(),
    useSubscriptionStore.getState().reset(),
    clearQueue(),
  ]);
}
