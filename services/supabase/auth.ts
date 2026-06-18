/** Thin wrapper around Supabase Auth so screens never import the client directly. */

import { getSupabase } from './client';
import { config } from '@/constants/config';

export interface AuthResult {
  userId: string | null;
  error: string | null;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  if (config.useMockData) return { userId: 'mock-user', error: null };
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  return { userId: data.user?.id ?? null, error: error?.message ?? null };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (config.useMockData) return { userId: 'mock-user', error: null };
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  return { userId: data.user?.id ?? null, error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  if (config.useMockData) return;
  await getSupabase().auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  if (config.useMockData) return { error: null };
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: 'salarycoach://reset-password',
  });
  return { error: error?.message ?? null };
}

export async function getCurrentSession(): Promise<{ userId: string | null }> {
  if (config.useMockData) return { userId: null };
  const { data } = await getSupabase().auth.getSession();
  return { userId: data.session?.user?.id ?? null };
}

export function onAuthStateChange(cb: (userId: string | null) => void): () => void {
  if (config.useMockData) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}
