# Financial OS Architecture

How Salary Coach AI is structured to behave like a real product, not a demo.

---

## 1. Layering (strict, one-directional)

```
UI (app/, components/)
        │  reads stores, never services directly for data
        ▼
Stores (store/*)  ──────────────►  Engine (services/engine/*)   [PURE]
   │  optimistic local state              deterministic math, no I/O
   │  AsyncStorage persistence
   ▼
Sync queue (services/sync/*)  ───►  Repositories (services/supabase/repositories/*)
   durable retrying mutations          row<->domain mappers + CRUD
        │                                       │
        ▼                                       ▼
                       Supabase (auth, Postgres + RLS, Edge Functions)
```

**Rules that keep this clean:**
- The **engine is pure** — no network, no storage, no `Date.now()` in math paths beyond timestamps. This is why it is trustworthy and trivially testable.
- **Stores are the client source of truth.** They persist to AsyncStorage and (in production) hydrate from repositories.
- **UI never touches Supabase.** It reads stores and calls store actions.
- **AI never computes.** It calls engine tools and narrates.

---

## 2. The deterministic engine (the moat lives here)

| Module | Responsibility |
|---|---|
| `constants.ts` | Single source of truth for every policy knob (rates, thresholds, risk mix). |
| `blueprint.ts` | Payday allocation waterfall (needs → debt → emergency → invest → goals → lifestyle). |
| `scores.ts` | Financial Health Score + Wealth Velocity Score + FI date. |
| `affordability.ts` | Legacy one-line affordability (kept for the Deno edge function). |
| **`decision.ts`** | **Multi-dimensional Decision Engine + confidence + Trust.** |
| `actionPlan.ts` | Prioritized "what to do next", biggest mistake / opportunity. |
| `projection.ts` | **Money GPS 2.0 (4 routes) + Future Self 2.0 (to retirement).** |
| `insights.ts` | Deterministic insight feed. |
| **`memory.ts`** | **Snapshot capture + longitudinal narrative.** |

Everything is paise-based integer math (`utils/finance.ts`). No floats touch money.

---

## 3. Data flow: a write (offline-first)

A user edits a goal:

1. `profileStore.updateGoal()` updates local state **immediately** (optimistic) and recomputes scores.
2. It calls `enqueueSync({ entity: 'goal', type: 'upsert', userId, payload })`.
3. `services/sync/queue.ts` persists the op to AsyncStorage and triggers a non-blocking flush.
4. `flushSync()` runs eligible ops via `runSyncMutation` → `goalsRepository.upsert` → Supabase.
5. On failure, the op is rescheduled with **exponential backoff** (1s → 60s cap); after 6 attempts it is **dead-lettered**, never blocking the queue.
6. On next app open, `useBootstrap` calls `flushSync()` to drain anything queued while offline.

**In demo mode (`config.useMockData`), `enqueueSync` and `flushSync` are no-ops** — local AsyncStorage persistence is the whole story, so the product is fully usable with zero backend.

## 4. Data flow: a read (cold start)

1. `useBootstrap` rehydrates persisted stores from AsyncStorage **before** any load runs (prevents mock data clobbering real saved data).
2. `profileStore.load()`:
   - If local data exists → use it, recompute scores.
   - Else if mock mode → seed the showcase persona.
   - Else (production) → `fetchFullProfile(userId)` batches users + financial_profiles + goals + expenses + investments + debts in **one parallel round-trip**, maps rows to domain types, and recomputes scores. Any error degrades gracefully to the empty/onboarding state.
3. `memoryStore.recordSnapshot()` captures this month's vitals.

---

## 5. User isolation

- Supabase **RLS** on every table: `auth.uid() = user_id` (see `0001_init.sql`). A user physically cannot read another user's rows.
- Repositories still scope every query by `user_id` defensively (defense in depth).
- On **sign-out**, `authStore.signOut()` resets profile, coach, blueprint, **and memory** stores so nothing leaks to the next account on a shared device.
- Sessions persist in **SecureStore** (encrypted), not AsyncStorage.

---

## 6. Trust Engine contract

```ts
interface Trust {
  reasoning: string[];   // how the conclusion was reached
  confidence: number;    // 0-100, from data completeness + margins
  assumptions: string[]; // returns, inflation, tenure, stability
  risks: string[];       // what would make this wrong
}
```

Attached to `Decision` and `MoneyGps`. Rendered verbatim in the UI. This is a product-level commitment: **no black-box recommendations.**

---

## 7. Configuration & environments

`constants/config.ts` derives `useMockData = !supabaseUrl`. Set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` to flip the entire app into production mode: real auth, real repositories, real sync. No code change required.

**Recommended next step:** split the single `useMockData` flag into `authMode`, `dataMode`, and `aiMode` so QA can mix real auth with mock data, etc.

---

## 8. Known architectural debt

1. **Engine duplication across runtimes.** Extract `services/engine` into a framework-agnostic package importable by both the RN app and the Deno edge function, to guarantee server/client parity.
2. **Memory not yet synced.** `FinancialSnapshot` maps onto `financial_scores`; wire a repository.
3. **No test harness.** The pure engine should have a Jest suite asserting golden outputs for representative personas.
