/**
 * Supabase client, configured for React Native.
 *
 * - Sessions persist in SecureStore (encrypted) rather than AsyncStorage so
 *   tokens are protected at rest.
 * - When env vars are missing the app falls back to mock mode (config.useMockData),
 *   and this client is never used for network calls.
 */

import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config } from '@/constants/config';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

function createSupabase(): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      // SecureStore is unavailable on web; fall back to default localStorage there.
      storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Lazy singleton. We avoid throwing at import time when env is missing so the
 * app can still boot in mock mode.
 */
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!config.supabase.isConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  if (!_client) _client = createSupabase();
  return _client;
}

export const isSupabaseConfigured = config.supabase.isConfigured;
