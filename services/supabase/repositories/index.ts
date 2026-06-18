/**
 * Supabase repositories — the only place the app reads/writes domain rows.
 *
 * Every method is guarded by `isSupabaseConfigured`; in demo/mock mode they are
 * no-ops (reads return null/empty, writes resolve immediately) so the local-only
 * experience is never affected. RLS guarantees a user can only touch their own
 * rows, so we still scope every query by user_id defensively.
 */

import type { Goal, SalaryBlueprint, UserProfile, FinancialProfile } from '@/types';
import { getSupabase, isSupabaseConfigured } from '../client';
import {
  blueprintToRow,
  financialProfileToRow,
  goalToRow,
  rowToDebt,
  rowToExpense,
  rowToFinancialProfile,
  rowToGoal,
  rowToInvestment,
  rowToUser,
  userToRow,
} from './mappers';

export interface FullProfileSnapshot {
  user: UserProfile;
  financials: FinancialProfile;
  goals: ReturnType<typeof rowToGoal>[];
  expenses: ReturnType<typeof rowToExpense>[];
  investments: ReturnType<typeof rowToInvestment>[];
  debts: ReturnType<typeof rowToDebt>[];
}

/**
 * Load the complete financial picture for a user in a single batched round-trip.
 * Returns null when Supabase isn't configured or the user has no profile yet.
 */
export async function fetchFullProfile(userId: string): Promise<FullProfileSnapshot | null> {
  if (!isSupabaseConfigured) return null;
  const sb = getSupabase();

  const [userRes, profileRes, goalsRes, expensesRes, investmentsRes, debtsRes] = await Promise.all([
    sb.from('users').select('*').eq('id', userId).maybeSingle(),
    sb.from('financial_profiles').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('goals').select('*').eq('user_id', userId).order('priority', { ascending: true }),
    sb.from('expenses').select('*').eq('user_id', userId),
    sb.from('investments').select('*').eq('user_id', userId),
    sb.from('debts').select('*').eq('user_id', userId),
  ]);

  if (!userRes.data || !profileRes.data) return null;

  return {
    user: rowToUser(userRes.data),
    financials: rowToFinancialProfile(profileRes.data),
    goals: (goalsRes.data ?? []).map(rowToGoal),
    expenses: (expensesRes.data ?? []).map(rowToExpense),
    investments: (investmentsRes.data ?? []).map(rowToInvestment),
    debts: (debtsRes.data ?? []).map(rowToDebt),
  };
}

export const profileRepository = {
  async upsertUser(user: UserProfile): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().from('users').upsert(userToRow(user), { onConflict: 'id' });
    if (error) throw error;
  },

  async upsertFinancials(financials: FinancialProfile, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase()
      .from('financial_profiles')
      .upsert(financialProfileToRow(financials, userId), { onConflict: 'user_id' });
    if (error) throw error;
  },
};

export const goalsRepository = {
  async upsert(goal: Goal, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().from('goals').upsert(goalToRow(goal, userId), { onConflict: 'id' });
    if (error) throw error;
  },

  async remove(goalId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase().from('goals').delete().eq('id', goalId).eq('user_id', userId);
    if (error) throw error;
  },
};

export const blueprintRepository = {
  async upsert(blueprint: SalaryBlueprint, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabase()
      .from('salary_blueprints')
      .upsert(blueprintToRow(blueprint, userId), { onConflict: 'id' });
    if (error) throw error;
  },
};

// -----------------------------------------------------------------------------
// Sync op executor — the offline queue calls this to apply a queued mutation.
// -----------------------------------------------------------------------------
export type SyncEntity = 'goal' | 'profile' | 'financials' | 'blueprint';
export type SyncOpType = 'upsert' | 'delete';

export interface SyncMutation {
  entity: SyncEntity;
  type: SyncOpType;
  userId: string;
  payload: unknown;
}

export async function runSyncMutation(op: SyncMutation): Promise<void> {
  switch (op.entity) {
    case 'goal':
      if (op.type === 'upsert') return goalsRepository.upsert(op.payload as Goal, op.userId);
      return goalsRepository.remove(op.payload as string, op.userId);
    case 'profile':
      return profileRepository.upsertUser(op.payload as UserProfile);
    case 'financials':
      return profileRepository.upsertFinancials(op.payload as FinancialProfile, op.userId);
    case 'blueprint':
      return blueprintRepository.upsert(op.payload as SalaryBlueprint, op.userId);
    default:
      return;
  }
}
