import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, type ThemeColors } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'sc:theme-mode';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

function resolve(mode: ThemeMode): { isDark: boolean; colors: ThemeColors } {
  const system = Appearance.getColorScheme() ?? 'light';
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return { isDark, colors: isDark ? darkTheme : lightTheme };
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  ...resolve('system'),
  setMode: (mode) => {
    void AsyncStorage.setItem(STORAGE_KEY, mode);
    set({ mode, ...resolve(mode) });
  },
  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
    const mode = stored ?? 'system';
    set({ mode, ...resolve(mode) });
  },
}));

// Keep colors in sync when the OS theme flips while in "system" mode.
Appearance.addChangeListener(() => {
  const { mode, setMode } = useThemeStore.getState();
  if (mode === 'system') setMode('system');
});
