import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { analytics } from '@/services/analytics';

/**
 * Fire a screen-view event whenever a screen gains focus. Centralizing this in
 * a hook (rather than ad-hoc effects) keeps funnel/retention analytics complete
 * and consistent across tabs and modals. Wire it once at the top of each screen.
 */
export function useScreenView(name: string): void {
  useFocusEffect(
    useCallback(() => {
      analytics.screen(name);
    }, [name]),
  );
}
