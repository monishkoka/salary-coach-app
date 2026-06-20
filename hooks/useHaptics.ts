import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Thin haptics wrapper that no-ops on web and centralizes feedback intent. */
export function useHaptics() {
  const safe = (fn: () => Promise<void>) => {
    if (Platform.OS === 'web') return;
    void fn();
  };
  return {
    light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    /** The crisp iOS "tick" for selecting chips, tabs, segmented controls. */
    selection: () => safe(() => Haptics.selectionAsync()),
    success: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    warning: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  };
}
