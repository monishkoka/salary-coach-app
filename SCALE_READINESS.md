# Scale Readiness — to 100,000 users

An honest assessment of what is production-ready, what was hardened in this pass, and the concrete checklist before a six-figure user base.

---

## Status summary

| Area | State | Confidence to 100k |
|---|---|---|
| Database schema + indexes | Complete (`0001`, `0002`) | High |
| Row Level Security | On every table | High |
| Client persistence | AsyncStorage + Zustand persist | High |
| Offline-first sync | **Added this pass** (retry + backoff + dead-letter) | Medium-High |
| Read efficiency | **Batched `fetchFullProfile`** (1 round-trip) | High |
| Auth + sessions | Supabase + SecureStore | High |
| AI cost/latency control | Edge function exists; no caching/rate-limit | Medium |
| Monitoring / error tracking | **Console only** | **Low — must fix** |
| Analytics pipeline | Taxonomy defined; **no sink** | **Low — must fix** |
| Billing | Simulated | Low |
| Automated tests | None | **Low — must fix** |

---

## What was hardened in this pass

- **Offline-first sync queue** (`services/sync/queue.ts`): durable, retrying, dead-lettering. Writes never block the UI and survive app restarts. No-ops safely in demo mode.
- **Batched profile read** (`fetchFullProfile`): the entire financial picture loads in a single parallel round-trip instead of N sequential queries — the single biggest cold-start win at scale.
- **Graceful degradation**: every network path is wrapped so a backend blip degrades to local/empty state rather than a crash.
- **Defensive query scoping**: repositories scope by `user_id` even though RLS already enforces it.

---

## Database: already indexed for the access patterns

`0001_init.sql` indexes every per-user, time-ordered read path:
`idx_goals_user (user_id, priority)`, `idx_blueprints_user (user_id, period_start desc)`, `idx_scores_user (user_id, computed_at desc)`, `idx_messages_convo (conversation_id, created_at)`, etc.

**At 100k users, add:**
- Partial index on `recommendations (user_id, status)` for the active-reco query.
- Consider monthly partitioning of `ai_messages` and `analytics_events` (highest-growth tables).
- `pgvector` ivfflat/hnsw index on `ai_memory.embedding` once memory recall ships.

---

## The must-fix checklist (in priority order)

### P0 — observability (you are flying blind without these)
1. **Error tracking**: wire Sentry (`@sentry/react-native`) into `ErrorBoundary` and the sync dead-letter path. The hooks already emit `app_error`.
2. **Analytics sink**: the `analytics` client is a clean seam — point it at PostHog/Amplitude and/or the `analytics_events` table. The event taxonomy is already designed.
3. **Edge function logging + alerting**: structured logs + latency/error dashboards for `ai-coach`.

### P0 — correctness
4. **Engine test suite**: golden-output Jest tests for representative personas across blueprint, scores, decision, projection, memory. The engine is pure — this is fast to write and prevents silent financial-math regressions.

### P1 — cost & abuse control
5. **AI rate limiting + caching** at the edge (per-user token budgets; cache identical engine-tool calls). Protects margin as coach usage grows.
6. **Confirm coach quota server-side** (today it's client-enforced in `coachStore`).

### P1 — revenue
7. **Real billing**: RevenueCat → write to `subscriptions` table → entitlements read from server, not local tier switch.

### P2 — engagement infra
8. **Push notifications** for payday/goal milestones (schema + types exist; needs Expo push + a scheduler).
9. **Server-side memory snapshots** (map `FinancialSnapshot` → `financial_scores`).

---

## Capacity sketch at 100k users

- **Reads:** dominated by cold-start `fetchFullProfile` (~6 indexed point/scan queries by `user_id`). Cheap and cacheable. Supabase/Postgres handles this comfortably with the existing indexes.
- **Writes:** low frequency (goal edits, payday actions, monthly snapshots), funneled through the sync queue. Batched and backoff-protected.
- **AI:** the cost/latency hotspot. Caching + rate limiting at the edge function is the lever. Keep the engine doing the math (free, instant) and the LLM doing only narration.
- **Realtime:** not currently used — good. Don't add it until a feature genuinely needs it.

---

## One-line readiness verdict

> The data layer, security model, and (now) the sync + read paths are ready for 100k. The blocking gaps are **observability (Sentry + analytics sink)** and an **engine test suite** — both are days of work, not months, and should land before any growth push.
