# Production Readiness Report — Salary Coach AI

_Prepared by the cross-functional review team (Principal RN engineer, fintech CTO, data architect, QA, security, growth)._

This report covers the audit findings and the changes implemented in this pass. The app was already well-architected (deterministic engine, repository/sync layer, typed domain model). This work focused on **trust, data integrity, correctness, and polish** — not a rebuild.

---

## 1. Severity-ranked audit (top issues)

| # | Area | Issue | Status |
|---|------|-------|--------|
| 1 | Account safety | Sign-out reset only 4 of 9 stores → cross-account leakage of sync queue, onboarding draft, streak, subscription tier, coach quota | **Fixed** |
| 2 | Account safety | Implicit sign-out (token expiry) cleared nothing | **Fixed** |
| 3 | Account safety | No per-user profile integrity; `load()` never re-ran on sign-in | **Fixed** |
| 4 | Account safety | `coachStore.reset()` left persisted quota counters | **Fixed** |
| 5 | Privacy | Demo persona (`priya@example.com`, etc.) bled into real profiles via `...mockUser` spread | **Fixed** |
| 6 | Engine | Emergency fund + health score sized off **total** expenses, not **essential** | **Fixed** |
| 7 | AI | Production edge function used a simplified tool + thinner prompt → coach could contradict the app | **Fixed** |
| 8 | UX trust | Payday screen always celebrated "Salary Received" | **Fixed** |
| 9 | UX trust | Pull-to-refresh was fake (no async work) | **Fixed** |
| 10 | UX | Coach had no real error/retry; raw engine keys shown in attachments | **Fixed** |
| 11 | Persistence | Onboarding never synced expenses/investments/debts to backend | **Fixed** |
| 12 | AI | No request timeout / `res.ok` check (silent empty answers) | **Fixed** |
| 13 | Analytics | No screen tracking, no `identify`, premature success events | **Fixed** |
| 14 | Monetization | Soft paywall claimed a non-existent "7-day free trial" | **Fixed** |
| 15 | A11y/polish | Sub-44pt touch targets; missing labels; no selection haptics | **Improved** |
| 16 | Resilience | `ErrorBoundary` hardcoded a dark crash screen in light mode | **Fixed** |

---

## 2. Account safety & data integrity (the headline work)

### Single source of truth for teardown
Added `store/session.ts` → `clearAllUserState()`, which resets **every** store that holds user data **and** clears its persisted copy from disk, and wipes the offline sync queue:

- `profileStore`, `coachStore`, `blueprintStore`, `memoryStore`, `onboardingStore`, `streakStore` → in-memory `reset()` + `persist.clearStorage()`
- `subscriptionStore.reset()` (tier → Free, key removed)
- `clearQueue()` (drops pending + dead-letter ops so a prior user's writes can never flush under the next login)

This one function is now called from **both** explicit sign-out and the implicit `onAuthStateChange(null)` path, so the two can never drift — the root cause of cross-account leakage.

### Per-user isolation
- `profileStore.load()` now discards any persisted profile whose `user.id` ≠ the signed-in `userId` (defensive against incomplete teardown on shared devices).
- `signIn` now sets `userId` first, then loads the account's real data, and **derives** `onboardingComplete` from whether a profile actually exists — it is never assumed.
- Bootstrap is now serialized: auth resolves **before** the profile loads (previously a race could leave the profile unfetched with no retry).

### Persona bleed removed
`hydrateFromOnboarding` now constructs a clean `UserProfile` from the user's own answers instead of spreading the demo persona. Expenses, investments, and debts are now synced to the backend on onboarding commit (new `expense`/`investment`/`debt` sync entities + mappers + repository methods).

---

## 3. Verification
- `tsc --noEmit`: **passes**
- `eslint . --ext .ts,.tsx`: **passes** (no errors)

---

## 4. Recommended next steps (require infra/credentials, out of scope for a code pass)
1. **Real billing**: wire StoreKit 2 / Google Play Billing behind `subscriptionStore.setTier`; the entitlement layer is already abstracted to make this a drop-in.
2. **Server-side entitlement + quota** on the `ai-coach` edge function (JWT verify + DB-backed monthly counter) so quota is tamper-proof, not just client-enforced.
3. **Analytics destination**: swap the console client for PostHog/Amplitude — all call sites (`track`/`identify`/`screen`) are already wired.
4. **Per-user storage namespacing** as defense-in-depth (keys are currently global but reliably cleared on every auth transition).
