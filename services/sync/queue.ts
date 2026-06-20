/**
 * Offline-first sync queue.
 *
 * Stores write down locally and optimistically; mutations are enqueued here and
 * flushed to Supabase opportunistically (on enqueue and on app bootstrap). Each
 * op carries a retry count with exponential backoff; ops that exhaust their
 * retries are parked in a dead-letter list rather than blocking the queue.
 *
 * The queue is a no-op in demo/mock mode (nothing is enqueued, flush returns
 * immediately) so the local-only experience is never touched.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';
import { runSyncMutation, type SyncMutation } from '@/services/supabase/repositories';
import { analytics } from '@/services/analytics';

const STORAGE_KEY = 'sc:sync-queue';
const DEAD_LETTER_KEY = 'sc:sync-dead-letter';
const MAX_ATTEMPTS = 6;

export interface QueuedOp extends SyncMutation {
  id: string;
  attempts: number;
  enqueuedAt: string;
  nextAttemptAt: number; // epoch ms; op is eligible to run when now >= this
}

let _queue: QueuedOp[] = [];
let _loaded = false;
let _flushing = false;
let _seq = 0;

const now = () => Date.now();
const backoffMs = (attempts: number) => Math.min(60_000, 1_000 * 2 ** attempts);

async function persist(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_queue));
}

async function ensureLoaded(): Promise<void> {
  if (_loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    _queue = raw ? (JSON.parse(raw) as QueuedOp[]) : [];
  } catch {
    _queue = [];
  }
  _loaded = true;
}

async function deadLetter(op: QueuedOp): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
    const list = raw ? (JSON.parse(raw) as QueuedOp[]) : [];
    list.push(op);
    await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(list.slice(-100)));
  } catch {
    // best effort
  }
  analytics.track('app_error', { scope: 'sync_dead_letter', entity: op.entity });
}

/** Number of operations currently waiting to sync. */
export function pendingCount(): number {
  return _queue.length;
}

/**
 * Drop every pending and dead-lettered op and wipe them from disk. Called on
 * sign-out so a previous account's unflushed mutations can never execute under
 * the next signed-in user on a shared device.
 */
export async function clearQueue(): Promise<void> {
  _queue = [];
  _loaded = true;
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, DEAD_LETTER_KEY]);
  } catch {
    // best effort
  }
}

/**
 * Enqueue a mutation for durable, retrying sync. No-ops in mock mode. Triggers a
 * non-blocking flush so writes propagate promptly when online.
 */
export async function enqueueSync(op: SyncMutation): Promise<void> {
  if (config.useMockData) return;
  await ensureLoaded();
  _queue.push({
    ...op,
    id: `${now()}-${(_seq += 1)}`,
    attempts: 0,
    enqueuedAt: new Date().toISOString(),
    nextAttemptAt: 0,
  });
  await persist();
  void flushSync();
}

/**
 * Attempt to drain the queue. Eligible ops (past their backoff window) are run
 * in order; failures are rescheduled with exponential backoff or dead-lettered
 * after MAX_ATTEMPTS. Safe to call repeatedly; concurrent calls are coalesced.
 */
export async function flushSync(): Promise<void> {
  if (config.useMockData || _flushing) return;
  await ensureLoaded();
  if (_queue.length === 0) return;

  _flushing = true;
  try {
    const remaining: QueuedOp[] = [];
    for (const op of _queue) {
      if (op.nextAttemptAt > now()) {
        remaining.push(op);
        continue;
      }
      try {
        await runSyncMutation(op);
        // success → drop from queue
      } catch {
        const attempts = op.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await deadLetter(op);
        } else {
          remaining.push({ ...op, attempts, nextAttemptAt: now() + backoffMs(attempts) });
        }
      }
    }
    _queue = remaining;
    await persist();
  } finally {
    _flushing = false;
  }
}
