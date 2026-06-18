import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';
import {
  getCurrentSession,
  onAuthStateChange,
  signIn as svcSignIn,
  signOut as svcSignOut,
  signUp as svcSignUp,
} from '@/services/supabase/auth';
import { analytics } from '@/services/analytics';
import { useProfileStore } from './profileStore';
import { useCoachStore } from './coachStore';
import { useBlueprintStore } from './blueprintStore';
import { useMemoryStore } from './memoryStore';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

const ONBOARDED_KEY = 'sc:onboarded';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  error: string | null;
  busy: boolean;
  /** Whether the signed-in user has finished onboarding (drives route guards). */
  onboardingComplete: boolean;
  init: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  finishOnboarding: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  userId: null,
  error: null,
  busy: false,
  onboardingComplete: false,

  init: async () => {
    const onboarded = (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
    // In mock mode there is no real session; start signed out and let the
    // user "sign in" instantly with any credentials.
    if (config.useMockData) {
      set({ status: 'signedOut', userId: null, onboardingComplete: onboarded });
      return;
    }
    const { userId } = await getCurrentSession();
    set({ status: userId ? 'signedIn' : 'signedOut', userId, onboardingComplete: onboarded });
    onAuthStateChange((id) => {
      set({ status: id ? 'signedIn' : 'signedOut', userId: id });
    });
  },

  signUp: async (email, password, name) => {
    set({ busy: true, error: null });
    const { userId, error } = await svcSignUp(email, password, name);
    if (error) {
      set({ busy: false, error });
      return false;
    }
    analytics.track('signup');
    // New users must complete onboarding before reaching the tabs.
    void AsyncStorage.setItem(ONBOARDED_KEY, 'false');
    set({ busy: false, status: 'signedIn', userId: userId ?? 'mock-user', onboardingComplete: false });
    return true;
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    const { userId, error } = await svcSignIn(email, password);
    if (error) {
      set({ busy: false, error });
      return false;
    }
    analytics.track('login');
    // Returning users skip onboarding (their data is loaded from the backend).
    void AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    set({ busy: false, status: 'signedIn', userId: userId ?? 'mock-user', onboardingComplete: true });
    return true;
  },

  signOut: async () => {
    await svcSignOut();
    // Clear all per-user state so nothing leaks to the next account on a shared
    // device. The onboarded flag is reset too, so a fresh sign-in re-onboards.
    useProfileStore.getState().reset();
    useCoachStore.getState().reset();
    useBlueprintStore.getState().reset();
    useMemoryStore.getState().reset();
    await AsyncStorage.setItem(ONBOARDED_KEY, 'false');
    set({ status: 'signedOut', userId: null, onboardingComplete: false });
  },

  finishOnboarding: () => {
    void AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    analytics.track('onboarding_completed');
    set({ onboardingComplete: true });
  },

  clearError: () => set({ error: null }),
}));
