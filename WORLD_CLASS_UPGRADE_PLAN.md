# Salary Coach AI — World-Class Upgrade Plan

> A staff-level audit and transformation roadmap for turning a strong MVP into the best AI-powered salary-coaching app for salaried professionals.
>
> **Status:** v1.0 · Audit + scoring + ranked roadmap + first implementation wave landed.
> **Scope:** React Native / Expo (Expo Router) iOS-first app, India market.

---

## 1. Scorecard — current vs target

Scores are 0–100, judged against a fundable, App-Store-launch-ready bar (not against "typical side project").

| Dimension | Current | Target (12-mo) | Verdict |
|---|---:|---:|---|
| **Architecture** | 72 | 90 | Excellent separation (deterministic engine vs AI narration), clean store/service/component layering. Held back by magic-number duplication (now fixed) and an unimplemented prod data layer. |
| **Scalability** | 45 | 88 | No repository layer; Postgres schema exists but the app never reads/writes tables. All data is in-memory. Fine for demo, blocks 100k users. |
| **UX** | 76 | 92 | Cohesive design system, India-native formatting, action-oriented Home. Animation budget spent almost entirely on Payday; empty/error states under-applied. |
| **Product** | 80 | 94 | Genuinely differentiated (prescriptive, not descriptive). Strong concept depth. Weakest link was retention loop (now seeded) and persistence (now fixed). |
| **AI** | 58 | 90 | Great doctrine ("engine computes, AI narrates"), but coach wasn't fed the engine's own intelligence, no streaming, no memory, dead prompt exports, edge/client logic fork. Context enrichment now landed. |
| **Security** | 50 | 90 | Secrets correctly off-device; SecureStore for JWT. But per-user state leaked across accounts (now fixed), no biometric lock, RLS unverified end-to-end, edge function `@ts-nocheck`. |
| **Performance** | 70 | 90 | Memoized engine, FlashList available. Static gauges, full-engine recompute on any slice change, no list virtualization on Home (single ScrollView). |
| **App Store readiness** | 48 | 92 | Has icons, privacy strings, legal links. Missing: real billing (StoreKit), account deletion, biometric lock, data persistence (was a hard rejection risk — now fixed), crash/analytics telemetry. |
| **Monetization readiness** | 42 | 90 | Tiers + entitlements modeled well, but billing is a local toggle and message quota was unenforced (now enforced). No StoreKit, no server-side entitlement source of truth. |
| **Investor readiness** | 62 | 92 | Outstanding blueprint/narrative, real working engine. Needs retention data, real persistence, and a believable path to the AA data moat. See `INVESTOR_READINESS_REPORT.md`. |
| **Weighted overall** | **59** | **91** | A high-quality MVP one disciplined quarter away from "fundable + launchable". |

---

## 2. Top weaknesses (ranked by damage)

1. **No data persistence** — a user finished onboarding, restarted, and lost everything (mock data reloaded). Catastrophic for trust and retention. **(Fixed in this wave.)**
2. **Production data layer is a stub** — `profileStore.load()` has a `TODO(prod)`; nothing reads/writes Supabase tables. Blocks multi-device, real users, scaling.
3. **Per-user state leaked across accounts** on a shared device (privacy/security). **(Fixed.)**
4. **AI coach wasn't a CFO** — engine outputs (action plan, GPS, scores, insights) were computed but never injected into the coach's grounding. **(Fixed for context + offline coach.)**
5. **No retention loop** — no streaks, daily check-in, weekly review, or progress celebration. **(Streak loop + Today's Focus seeded.)**
6. **Monetization not enforced** — `coachMessagesPerMonth` defined but never checked; billing is a cosmetic local toggle. **(Quota enforced; StoreKit still pending.)**
7. **Magic-number sprawl / duplication** in the engine (14% debt, risk mix, SIP target in 3+ files). **(Centralized into `services/engine/constants.ts`.)**
8. **No biometric app lock, no account deletion flow** — App Store + DPDP requirements.
9. **Analytics is dev-console-only**, `identify()` never called — no funnels, no retention measurement in prod.
10. **No streaming coach responses, no conversation memory** despite types/edge support for `conversationSummary`.

---

## 3. Top opportunities (highest leverage)

1. **Account Aggregator (AA) integration** — the structural moat: consented, auto-synced financial data turns a manual-entry tool into an always-on CFO.
2. **Real persistence + sync** — unlock multi-device, retention measurement, and the data flywheel.
3. **Retention engine** — payday moments, weekly reviews, monthly coaching reports, milestone celebrations.
4. **AI memory + recommendation ledger** — "last month you chose to delay the car" continuity compounds trust.
5. **Enterprise (employer wellness)** — a distribution wedge with high LTV and privacy-preserving aggregate dashboards.
6. **Confidence-scored, tool-calling coach** — every numeric claim cited to an engine tool with a confidence + assumptions footer.

---

## 4. The Top 100 improvements (ranked)

Ranked by expected lift across **retention × trust × quality × ratings × revenue**. `[DONE]` = shipped in this wave. `[P0/P1/P2]` = priority.

### Tier 1 — Foundational correctness & trust (1–20)
1. `[DONE]` Persist profile data so it survives app restart (`zustand/persist` + AsyncStorage).
2. `[DONE]` Persist onboarding draft (no data loss on mid-flow kill).
3. `[DONE]` Persist blueprint + completed-action progress; reset progress only per pay cycle.
4. `[DONE]` Persist coach conversation history.
5. `[DONE]` Reset all per-user stores on sign-out (no cross-account leakage).
6. `[DONE]` Rehydrate persisted profile before `load()` seeds mock data.
7. `[P0]` Implement the Supabase repository layer (read/write `users`, `financial_profiles`, goals, etc.).
8. `[P0]` Persist onboarding + edits to Supabase, not just device.
9. `[P0]` Verify Row-Level Security end-to-end with automated tests.
10. `[P0]` Add account deletion + data export (DPDP + App Store requirement).
11. `[P0]` Biometric (Face ID) app lock with secure-enclave gate.
12. `[P1]` Server-side entitlement source of truth (don't trust client tier).
13. `[DONE]` Enforce free-tier coach message quota.
14. `[P0]` Real StoreKit 2 / RevenueCat billing + restore purchases.
15. `[P1]` Wire `analytics.identify()` and a real provider (PostHog/Amplitude).
16. `[P1]` Crash reporting (Sentry) with privacy scrubbing.
17. `[P1]` Optimistic writes with rollback + offline queue.
18. `[P1]` Migration/versioning strategy for persisted store shapes.
19. `[P2]` Currency/locale abstraction (groundwork beyond INR).
20. `[P1]` Idempotent score/blueprint recompute on data change (single source).

### Tier 2 — AI as a personal CFO (21–38)
21. `[DONE]` Centralize engine policy constants (`services/engine/constants.ts`).
22. `[DONE]` Inject engine intelligence (action plan, Money GPS, scores) into coach grounding (`advisorySignals`).
23. `[DONE]` Upgrade offline coach to reason like a CFO (plan/status/improve intents + CFO fallback).
24. `[P0]` Unify affordability logic between client engine and edge function (single shared module).
25. `[P0]` Implement `forecast_goal` tool (declared but dead) or remove the spec.
26. `[P1]` Expose GPS, scenarios, action plan as callable tools to the model.
27. `[P1]` Streaming coach responses (SSE) for perceived speed.
28. `[P1]` Conversation memory: summarize + persist `conversationSummary`; pass it to the model.
29. `[P1]` Recommendation ledger (accepted/dismissed/done) → continuity ("last month you…").
30. `[P1]` Confidence + assumptions footer on every numeric answer.
31. `[P1]` Numeric-consistency eval harness (LLM answer must match engine output).
32. `[P2]` Intent router (cheap model) → frontier model only for complex reasoning (cost control).
33. `[P2]` Salary DNA archetype classification driving tone.
34. `[P2]` "Apply to plan" actions from coach answers.
35. `[P1]` Remove dead prompt exports / unify `POLICY_PROMPT` usage on the edge function.
36. `[P2]` Long-press any number → "Ask the Coach about this".
37. `[P2]` Coach proactively opens payday with the command-center checklist.
38. `[P2]` pgvector RAG over the user's own insights/decisions.

### Tier 3 — Retention loops (39–55)
39. `[DONE]` Daily check-in streak system (`streakStore`).
40. `[DONE]` "Today's Focus" card on Home (single highest-impact action + streak badge).
41. `[P1]` Payday push notification + command-center deep link.
42. `[P1]` Weekly review (auto-generated, shareable) — "your week in money".
43. `[P1]` Monthly coaching report with trend deltas.
44. `[P1]` Milestone celebrations (emergency fund funded, debt cleared, goal hit) with animation + haptics.
45. `[P1]` Streak-freeze / grace day to avoid demoralizing breaks.
46. `[P1]` Score-improvement nudges ("+4 Health this month").
47. `[P2]` Achievements/levels (XP, badges) tied to real outcomes, not vanity.
48. `[P2]` Bill-due and tax-deadline reminders.
49. `[P2]` Smart re-engagement (lapsed-user) notifications.
50. `[P1]` Net-worth "first positive month" celebration (Meena persona).
51. `[P2]` Annual "Money Wrapped" recap.
52. `[P2]` Goal progress carousel with on-track/at-risk pills on Home.
53. `[P1]` Notification preference center (granular, DPDP-friendly).
54. `[P2]` Lifestyle-inflation detector alert (trailing spend vs income growth).
55. `[P2]` Cohort benchmarks ("people like you save X%") — privacy-safe.

### Tier 4 — Apple-quality UI/UX (56–74)
56. `[P1]` Animate score arcs/dials/rings (count-up + spring) on Home appearance.
57. `[P1]` Apply `EmptyState` everywhere (goals=0, insights filtered to 0, no financials).
58. `[P1]` Wire the existing `ErrorState` primitive + retry across feature screens.
59. `[P1]` Theme-aware `ErrorBoundary` + bootstrap splash (currently hardcoded colors).
60. `[P1]` Replace onboarding `about` raw `TextInput` with the shared `TextField`.
61. `[P1]` Wrap onboarding `welcome` in `OnboardingShell` (consistent progress).
62. `[P1]` Skeleton/shimmer loading states (not just spinners).
63. `[P1]` Haptics on high-value interactions (card nav, coach send, goal chips).
64. `[P1]` Step transition animations in onboarding (shared element / slide).
65. `[P2]` Pull-to-refresh with real perceived async + success haptic.
66. `[P2]` Progressive disclosure on Home (collapse long sections).
67. `[P2]` Dynamic Type + VoiceOver labels audit on all data.
68. `[P2]` Color-blind-safe palette verification (≥4.5:1 contrast).
69. `[P2]` Draggable assumption sliders in Future Self (cause→effect motion).
70. `[P2]` Reorderable goal priority (drag).
71. `[P2]` Empty/first-run coaching for brand-new users.
72. `[P1]` Real billing UI states (loading, error, restore) in paywall.
73. `[P2]` App icon / splash polish pass; launch screen parity.
74. `[P2]` Reduce-motion accessibility setting respected.

### Tier 5 — Performance & scale (75–88)
75. `[P1]` Virtualize Home (FlashList sections) instead of one ScrollView.
76. `[P1]` Split `useFinancialPlan` memoization so unrelated edits don't recompute all four engines.
77. `[P1]` Index `(user_id, created_at)` on all time-series tables; partition `transactions`/`ai_messages`.
78. `[P1]` Server-side caching (Redis) for hot reads + rate limits.
79. `[P1]` Job queue (BullMQ) for nightly score/insight recompute + notifications.
80. `[P2]` Debounce/batch persisted writes.
81. `[P2]` Lazy-load heavy chart libs (route-level code splitting).
82. `[P2]` Image/asset optimization + font preloading.
83. `[P2]` Memoize chart components; avoid re-render storms on theme change.
84. `[P2]` Edge function cold-start mitigation + streaming.
85. `[P2]` Data-residency (India region) for DB + LLM proxy.
86. `[P2]` Background-state stability (snapshot + restore on resume).
87. `[P2]` Bundle-size budget + startup TTI measurement.
88. `[P2]` LLM cost dashboard + per-user ceilings.

### Tier 6 — Growth, compliance & moat (89–100)
89. `[P0]` Account Aggregator (AA) integration via TSP (Setu/Finvu/Anumati).
90. `[P1]` Auto transaction categorization + recurring/subscription detection.
91. `[P1]` SEBI posture decision (education vs RIA) + compliant copy everywhere.
92. `[P1]` Enterprise (employer wellness) portal + aggregate dashboards.
93. `[P1]` Tax planner (old vs new regime, 80C/80D/NPS/HRA optimization).
94. `[P2]` Insurance adequacy advisor (term + health gap analysis).
95. `[P2]` Life Event Planner modules (marriage, home, child, FIRE).
96. `[P2]` Referral loop + invite mechanics.
97. `[P2]` Affiliate (transparent, suitability-checked) revenue line.
98. `[P2]` Feature flags + A/B (onboarding & paywall optimization).
99. `[P2]` Couples/household view.
100. `[P2]` Regional language support (tier-2/3 expansion).

---

## 5. Immediate fixes (this wave — shipped)

These were implemented now because they are **safe, high-leverage, and verified by typecheck + lint**:

- **Data persistence** for `profileStore`, `onboardingStore`, `blueprintStore`, `coachStore` via `zustand/persist` + AsyncStorage, with `partialize` to persist only durable data. `useBootstrap` rehydrates the profile before `load()` so saved data is never clobbered by the mock seed.
- **Sign-out hygiene**: `authStore.signOut` resets profile/coach/blueprint and clears the onboarded flag — no cross-user leakage on shared devices.
- **Engine constants module** (`services/engine/constants.ts`) — one source of truth for `HIGH_INTEREST_PCT`, `RISK_MIX`, savings/SIP targets, inflation, and waterfall shares; `blueprint.ts`, `actionPlan.ts`, and `projection.ts` now import them (kills duplication + drift).
- **CFO-grade AI grounding**: `advisorySignals()` injects the engine's biggest mistake, biggest opportunity, top 3 prioritized actions, and Money-GPS route correction into the coach context. The offline `MockProvider` now answers "what should I do / am I on track / how do I improve" by narrating the action plan and GPS, with a CFO-style fallback.
- **Monetization enforcement**: coach message quota is enforced per calendar month against plan entitlements, with remaining-message UI and an upgrade CTA when the limit is hit.
- **Retention loop**: a daily check-in streak (`streakStore`) and a "Today's Focus" Home card surfacing the single highest-impact action with one-tap completion + streak badge.

## 6. Medium-term (next 1–2 sprints)

- Supabase repository layer + RLS tests + account deletion/export + biometric lock.
- StoreKit 2 / RevenueCat billing with server-side entitlement truth.
- Streaming coach + conversation memory + recommendation ledger + unified affordability tool.
- Notifications engine (payday, weekly review, milestones) + real analytics provider + Sentry.
- UI polish: animate gauges, apply empty/error states everywhere, fix onboarding input/shell inconsistencies.

## 7. Long-term (the moat)

- Account Aggregator auto-sync → the data flywheel.
- Tax planner, insurance advisor, Life Event Planner, FIRE/Monte Carlo (Premium).
- Enterprise employer-wellness distribution.
- pgvector RAG memory, intent routing for cost, confidence-scored tool-calling coach.

---

*Implementation details for this wave live in the git diff; every change passed `tsc --noEmit` and `eslint`.*
