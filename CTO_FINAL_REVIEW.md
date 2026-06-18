# CTO Final Review — "10,000 Users Tomorrow"

_Brutally honest. The question: if Salary Coach AI acquired 10,000 real users tomorrow, what would break — technically, in product, UX, scalability, retention, and as a business?_

**TL;DR:** The engineering foundation is genuinely good. The thing that would actually kill you tomorrow is not code quality — it's that **the app ships in mock mode**. Every user would see the same fictional person ("Priya, ₹1.4L/month, Bengaluru"). That single fact dominates this list.

---

## The top 20 risks (ranked by likelihood × blast radius)

### 1. The app has no real backend data path — everyone is "Priya" 🔴 Catastrophic
`profileStore.load()` is a no-op unless Supabase env is set, and even then the repository layer that reads/writes user data **does not exist yet**. 10,000 users would onboard, then see mock data or an empty shell. This is the #1 launch blocker. Nothing else matters until it's fixed.

### 2. No account deletion / data export 🔴 Legal + App Store
Apple Guideline 5.1.1(v) **requires** in-app account deletion. For a finance app holding income, debts, and net worth, DPDP (India) / GDPR-style deletion + export obligations also apply. Missing this = rejection and regulatory exposure.

### 3. "Educational guidance, not advice" may not be enough 🔴 Regulatory
You're telling Indian users how to allocate salary, which instruments to favor (ELSS/PPF/NPS), and whether to buy a car. SEBI's investment-adviser regime is aggressive about anything resembling personalized advice. The disclaimer helps but won't fully shield you at scale. Get a real legal review before marketing this as a "personal CFO."

### 4. Onboarding asks for everything before delivering value 🟠 Retention killer
10 steps (name, salary, 5 expense fields, savings, investments, debts, goals, risk quiz) before the first payoff. Expect 40–60% drop-off. The payoff (the blueprint) is excellent — but you're gating it behind a long form. Consider a "salary → instant mini-blueprint → enrich later" path.

### 5. AI coaching cost & abuse at scale 🟠 Cost + reliability
Each coach message = up to **two** GPT calls (tool round-trip). The free-tier cap (`coachMessagesPerMonth: 5`) is **defined but not enforced**. 10,000 users hammering the coach with no rate limit and no enforcement = a surprise OpenAI bill and a single-point-of-failure edge function with no retry/queue.

### 6. The financial math is plausible but not validated 🟠 Trust
Returns (10–12%), the 4% FIRE rule, EMI at 11%/36mo, "25× expenses" — all reasonable defaults, but they're **assumptions presented as projections** ("₹X richer in 10 years"). One viral screenshot of a wrong-looking number erodes trust fast. You need (a) unit tests on the engine, (b) visible assumptions, and (c) conservative framing on projections.

### 7. Zero automated tests 🟠 Velocity + regressions
The deterministic engine is the product's brain and has **no tests**. At 10k users and a fast iteration cadence, a one-line change to `blueprint.ts` or `scores.ts` could silently corrupt everyone's plan. This is the highest-ROI debt to pay down.

### 8. No crash reporting or product analytics 🟠 You'd be flying blind
`analytics` is a `console.log` no-op and there's no Sentry. With 10k users you would not know what's crashing, where users drop off, or whether the coach is failing. Wire Sentry + a real analytics sink before launch, not after.

### 9. Data accuracy depends entirely on self-reported, never-updated inputs 🟠 Retention
Users enter expenses once during onboarding and rarely return to update them. Within weeks the blueprint reflects stale reality, advice feels generic, and engagement decays. Without bank/SMS aggregation (or at least reminders to refresh), the "knows your full picture" promise quietly becomes false — and the app shows static mock-style trends ("savings rate climbed to 41%") that aren't actually computed from real history.

### 10. Insights/trends are partly hardcoded narratives 🟠 Trust
Some insights (e.g. quarter-over-quarter series in `mockData`) and "Predicted net worth" framing imply historical tracking the app doesn't yet do. At scale this reads as fake. Either compute from real snapshots (`financial_scores` is append-only — good foundation) or stop implying history you don't have.

### 11. Edge function is a fragile single dependency 🟡 Reliability
One Deno function, single-round tool calls, returns raw `String(err)` on failure, no timeout/retry/circuit-breaker. The app *does* gracefully fall back to the local mock provider (nice), but that means a degraded user silently gets generic answers instead of personalized ones, with no signal to you.

### 12. Subscription is local-only; revenue isn't real 🟡 Business
`setTier` just writes to AsyncStorage — there's no StoreKit/IAP. Today anyone can "upgrade" to Pro for free by tapping a button. No real revenue, no receipt validation, no restore-purchases. The monetization engine is a placeholder.

### 13. Auth/onboarding routing is optimistic 🟡 Correctness
`signIn()` unconditionally sets `onboardingComplete = true`; a returning user whose onboarding never finished (or who reinstalls) could be routed straight into empty tabs. Routing must be driven by backend `onboarding_completed_at`, which requires risk #1 to be solved first.

### 14. Offline / flaky-network behavior is untested at scale 🟡 UX
Mobile users in India will frequently be on poor connections. The coach has a fallback; the rest of the app assumes data is present. Define explicit loading/error/empty states for the (future) networked reads, and test on throttled networks.

### 15. No migration/versioning strategy for stored state 🟡 Maintainability
AsyncStorage keys (`sc:onboarded`, `sc:theme-mode`, `sc:subscription-tier`) have no version/namespace migration plan. A future shape change could strand existing users' local state.

### 16. Accessibility is partial 🟡 Reach + compliance
Improved this pass, but not audited end-to-end with VoiceOver. A finance app excluding low-vision users is both a reach loss and a growing legal risk.

### 17. Single-region, single-currency, INR-only assumptions baked in 🟡 Scalability
Lakh/crore formatting, Indian instruments, and INR are hardcoded throughout. Fine for an India-first launch — but expansion would be a large refactor, and there's no i18n layer.

### 18. Performance under large real datasets unproven 🟢 Perf
Today's data is tiny (mock). With years of real transactions/snapshots, the all-in-`ScrollView` Home and the per-render engine recompute may need virtualization and memo tuning. Low risk now, real later.

### 19. No abuse/fraud/PII-leak monitoring 🟢 Security ops
RLS is solid, but there's no anomaly detection, no audit logging of sensitive reads, and the edge function could leak internals on error. At 10k users you become a target.

### 20. Key-person / bus-factor & ops readiness 🟢 Org
No tests, no CI gates, no runbooks, stub observability — the system is currently only safely changeable by people who hold it all in their heads. That doesn't survive a team or an incident at 10k users.

---

## What's genuinely strong (don't break these)

- **Architecture & type safety.** Strict TS, no `any`, clean layering, deterministic engine separated from AI narration.
- **Security primitives.** Server-side secrets, SecureStore sessions, RLS everywhere, anon-key-only client.
- **Design system.** Consistent tokens, theming, haptics, tasteful motion, good touch targets.
- **The core idea is differentiated.** "Tell me what to do with my *next* salary," grounded in real math, is a sharp wedge versus expense trackers.

## The honest verdict

This is a **high-quality demo on a production-grade skeleton** — not yet a production product. The code you can see is better than most seed-stage fintechs. The danger is the code that *isn't there yet*: real data, real payments, account deletion, tests, and observability.

**If you truly had 10k users tomorrow, do not launch.** In priority order:
1. Build the Supabase repository layer + wire real data (risk #1).
2. Add in-app account deletion + data export (risk #2).
3. Get SEBI/advice + privacy legal review (risk #3).
4. Enforce entitlements + rate-limit the coach; wire real IAP (risks #5, #12).
5. Add engine unit tests + Sentry + analytics (risks #7, #8).

Ship to a few hundred TestFlight users first. Earn the 10,000.
