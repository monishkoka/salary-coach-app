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
import { clearAllUserState } from './session';

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
      // Implicit sign-out (token expiry / revoked session) must tear down all
      // per-user state exactly like an explicit sign-out, or the next account
      // on this device inherits the previous user's data.
      if (!id) {
        if (useAuthStore.getState().status === 'signedIn') {
          void clearAllUserState();
          void AsyncStorage.setItem(ONBOARDED_KEY, 'false');
        }
        set({ status: 'signedOut', userId: null, onboardingComplete: false });
        return;
      }
      set({ status: 'signedIn', userId: id });
    });
  },

  signUp: async (email, password, name) => {
    set({ busy: true, error: null });
    const { userId, error } = await svcSignUp(email, password, name);
    if (error) {
      set({ busy: false, error });
      return false;
    }
    const id = userId ?? 'mock-user';
    analytics.identify(id, { method: 'email' });
    analytics.track('signup');
    // New users always start onboarding; clear any stale state from a prior
    // account that may have used this device.
    await clearAllUserState();
    void AsyncStorage.setItem(ONBOARDED_KEY, 'false');
    set({ busy: false, status: 'signedIn', userId: id, onboardingComplete: false });
    return true;
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    const { userId, error } = await svcSignIn(email, password);
    if (error) {
      set({ busy: false, error });
      return false;
    }
    const id = userId ?? 'mock-user';
    analytics.identify(id, { method: 'email' });
    analytics.track('login');
    // Set the user id first so the profile fetch is scoped correctly, then load
    // the account's real data from the backend. Onboarding completion is derived
    // from whether a profile actually exists — never assumed.
    set({ userId: id });
    await useProfileStore.getState().load();
    const hasProfile = !!useProfileStore.getState().user;
    void AsyncStorage.setItem(ONBOARDED_KEY, hasProfile ? 'true' : 'false');
    set({ busy: false, status: 'signedIn', userId: id, onboardingComplete: hasProfile });
    return true;
  },

  signOut: async () => {
    // Set signed-out first so the auth-state listener treats the imminent
    // Supabase sign-out event as already handled (avoids a double teardown).
    set({ status: 'signedOut', userId: null, onboardingComplete: false });
    // Clear ALL per-user state + persisted copies + the sync queue so nothing
    // leaks to the next account on a shared device.
    await clearAllUserState();
    await AsyncStorage.setItem(ONBOARDED_KEY, 'false');
    await svcSignOut();
    analytics.track('logout');
  },

  finishOnboarding: () => {
    void AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    analytics.track('onboarding_completed');
    set({ onboardingComplete: true });
  },

  clearError: () => set({ error: null }),
}));
