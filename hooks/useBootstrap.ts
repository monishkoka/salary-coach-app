import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useProfileStore } from '@/store/profileStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useStreakStore } from '@/store/streakStore';
import { useMemoryStore } from '@/store/memoryStore';
import { flushSync } from '@/services/sync/queue';
import { analytics } from '@/services/analytics';

/**
 * One-time app bootstrap: hydrate theme, restore auth session, preload profile.
 * Returns `ready` so the root layout can hold the splash until we know where
 * to route (auth vs onboarding vs tabs).
 */
export function useBootstrap(): { ready: boolean } {
  const [ready, setReady] = useState(false);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const initAuth = useAuthStore((s) => s.init);
  const loadProfile = useProfileStore((s) => s.load);
  const hydrateSubscription = useSubscriptionStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      analytics.track('app_open');
      // Ensure the persisted profile is rehydrated from disk BEFORE load() runs,
      // otherwise load() would seed mock data over the user's real saved data.
      await useProfileStore.persist.rehydrate?.();
      // Auth must resolve BEFORE the profile loads: load() scopes its fetch and
      // its per-user integrity check to the signed-in userId. Running them in
      // parallel can leave the profile unfetched (userId still null) with no retry.
      await Promise.all([hydrateTheme(), initAuth(), hydrateSubscription()]);
      await loadProfile();
      // Rehydrate memory history from disk, then capture this month's snapshot
      // so the coach's financial memory always reflects the latest picture.
      await useMemoryStore.persist.rehydrate?.();
      useMemoryStore.getState().recordSnapshot();
      // Record the daily check-in for the retention streak.
      useStreakStore.getState().checkIn();
      // Drain any writes queued while offline (no-op in mock mode).
      void flushSync();
      setReady(true);
    })();
  }, [hydrateTheme, initAuth, loadProfile, hydrateSubscription]);

  return { ready };
}
