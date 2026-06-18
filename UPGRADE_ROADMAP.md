# Salary Coach AI — "Next Level" Upgrade Roadmap & Implementation Log

> Positioning shift: from **"What did I spend?"** → **"What should I do next?"**
> Every screen is now a financial decision surface. This document is both the
> ranked roadmap and a log of what shipped in this upgrade.

---

## 1. How improvements were ranked

Each candidate was scored on four axes (the CTO lens for a venture-backed
fintech preparing for App Store launch):

| Axis | Why it matters |
|---|---|
| **User value** | Does it help the user make a better decision *today*? |
| **Retention impact** | Does it create a payday/forward-looking habit loop? |
| **Monetization** | Is it a credible paywall "aha" moment? |
| **Effort** | Can it reuse the existing deterministic engine + design system? |

The existing MVP already had the hardest, highest-leverage asset: a clean
**deterministic engine** (blueprint, health/velocity scores, affordability, FI
date) separated from AI narration, plus typed Zustand stores and a polished
design system. The fastest path to a 10x product was to **extend the engine
forward in time** and surface it as prescriptive coaching — not to rebuild.

---

## 2. Ranked roadmap

### ✅ Tier 1 — Signature differentiators (shipped in this upgrade)

| # | Feature | Value | Retention | Monetization | Effort | Status |
|---|---|---|---|---|---|---|
| 1 | **Forecast/Projection engine** (Money GPS + Future Self math) | ★★★ | ★★★ | ★★★ | Med | ✅ |
| 2 | **AI Action Plan engine** (biggest mistake / opportunity / actions) | ★★★ | ★★★ | ★★ | Low | ✅ |
| 3 | **Financial Health Engine** (5 named sub-scores + improvement plan) | ★★★ | ★★ | ★★ | Low | ✅ |
| 4 | **Insights engine** (deterministic, personalized) | ★★ | ★★ | ★ | Low | ✅ |
| 5 | **Home → Mission Control** redesign | ★★★ | ★★★ | ★★ | Med | ✅ |
| 6 | **Money GPS** screen (current vs recommended route) | ★★★ | ★★★ | ★★★ | Med | ✅ |
| 7 | **Future Self Simulator** (interactive scenario compare) | ★★★ | ★★★ | ★★★ | Med | ✅ |
| 8 | **Payday Experience** (animated, premium) | ★★★ | ★★★ | ★★ | Med | ✅ |
| 9 | **Subscription/entitlements** architecture + soft paywalls | ★★ | ★ | ★★★ | Low | ✅ |
| 10 | **DB migrations + analytics events** for all of the above | ★ | ★★ | ★★ | Low | ✅ |

### 🔜 Tier 2 — Next (highest-leverage follow-ups)

| Feature | Notes |
|---|---|
| **Context-aware Coach v2** | Wire `forecast_goal` engine tool into the AI tool-calling loop; have the coach call `simulateScenarios`/`buildMoneyGps` so "Can I afford X?" answers cite goal/velocity deltas. The deterministic functions already exist. |
| **Blueprint history + month-over-month compare** | Persist `salary_blueprints` per cycle (schema ready) and add a compare view. |
| **Score history trends** | Append `financial_scores` snapshots monthly; show health/velocity trend lines (the time-series tables already exist). |
| **Real analytics provider** | Swap the console client in `services/analytics` for PostHog/Amplitude; pipe to `analytics_events` table. |
| **StoreKit 2 IAP** | Replace the local entitlement switch in `subscriptionStore` with real receipts; entitlement gating stays unchanged. |
| **Server-side persistence** | Implement `profileStore.load()` prod path against the Supabase repositories. |

### 🧭 Tier 3 — Platform depth (per PRODUCT_BLUEPRINT phases 3–4)

Account Aggregator auto-import, Life Event Planner, tax optimizer, Monte-Carlo
/ FIRE modeling (Premium), couples view, gamification, notifications engine.

---

## 3. What shipped — architecture

The upgrade preserves the **deterministic-core, AI-for-language** philosophy. All
new math is pure, paise-based, and unit-testable. The AI never invents numbers.

### New engine modules (`services/engine/`)

| File | Responsibility |
|---|---|
| `projection.ts` | `buildMoneyGps(ctx)` and `simulateScenarios(ctx)` — month-by-month net-worth/savings/investments trajectories with annual salary-growth step-ups; current vs recommended routes; per-goal ETAs; retirement readiness; velocity proxy. |
| `actionPlan.ts` | `buildActionPlan(ctx)` — biggest mistake, biggest opportunity, and a prioritized, quantified action list (debt → emergency → investing → goals → insurance). |
| `insights.ts` | `generateInsights(ctx)` — personalized savings/spending/wealth/forecast insights with sentiment. |
| `scores.ts` (extended) | Added **Lifestyle Control** + **Investment Discipline** sub-scores; `explainHealth` now returns the five named drivers (Emergency Readiness, Investment Discipline, Goal Achievement, Lifestyle Control, Debt Management); new `healthImprovementPlan()` for strengths/weaknesses + plan. |

### New billing layer

| File | Responsibility |
|---|---|
| `services/billing/entitlements.ts` | Pure tier → feature map (`Free`/`Pro`/`Premium`/`Enterprise`) + `PLAN_INFO` paywall copy. |
| `store/subscriptionStore.ts` | Entitlement state, `can(feature)`, local tier switch (StoreKit plugs in later). Demo defaults to **Pro** so the full product is visible; downgrade in Profile to see paywalls. |

### New state / hooks

| File | Responsibility |
|---|---|
| `hooks/useFinancialPlan.ts` | Memoized derivation of action plan + Money GPS + scenarios + insights from the profile context. |

### New components

`charts/VelocityDial.tsx` · `charts/ProjectionChart.tsx` ·
`cards/HighlightCard.tsx` (mistake/opportunity) · `cards/ActionItemCard.tsx` ·
`cards/GpsRouteCard.tsx` · `billing/PaywallNotice.tsx` ·
`layout/ScreenHeader.tsx`.

### New / redesigned screens

| Route | What it is |
|---|---|
| `app/(tabs)/index.tsx` | **Mission Control** — payday command, biggest mistake/opportunity, Health score, Velocity dial (current vs recommended), AI action plan, blueprint, 10-yr projection preview, emergency fund, goals. |
| `app/money-gps.tsx` | **Money GPS** — current vs recommended route with goal ETAs, emergency completion, retirement readiness, 10-yr net worth, and a route-correction line. |
| `app/future-self.tsx` | **Future Self Simulator** — 4 scenarios, interactive horizon (1/3/5/10y), net-worth chart vs current baseline, forecast breakdown, "you'd be ₹X richer" uplift. |
| `app/payday.tsx` | **Payday Experience** — animated (Reanimated) celebration, staggered allocation reveal, predicted net worth. |
| `app/paywall.tsx` | Plan comparison + upgrade. |
| `app/(tabs)/insights.tsx` | Financial Health Engine breakdown + improvement plan + engine-generated insight feed. |
| `app/(tabs)/goals.tsx` | Added forward-planning tiles (Money GPS, Future Self) + entitlement-gated goal creation. |

### Database (`supabase/migrations/0002_upgrade.sql`)

New user-scoped, RLS-protected tables: `future_projections`,
`money_gps_routes`, `payday_events`, `insights`, `analytics_events`,
`subscriptions` (+ enums, indexes, `updated_at` trigger, and a new-user
subscription seed trigger). Money remains integer paise; score/projection
tables are append-only for trend history.

### Analytics

Added events: `money_gps_viewed`, `future_self_simulated`, `scenario_compared`,
`payday_celebrated`, `action_plan_item_done`, `health_breakdown_viewed`,
`feature_locked_hit`. North Star remains `recommendation_executed`.

---

## 4. App Store readiness notes (audit pass)

- **No invented numbers**: every figure is engine-derived and traceable to inputs
  — important for financial-app review and trust.
- **Disclaimers**: "Educational guidance, not regulated financial advice" retained
  in Profile; paywall states "No data is ever sold."
- **Accessibility**: new interactive controls have `accessibilityRole` /
  `accessibilityLabel` (action toggles, back button, payday CTA).
- **Resilience**: every new screen has a `LoadingState` guard and null-safe data
  access; forecasts degrade gracefully when surplus is 0 / data is missing.
- **Money safety**: all currency stays in integer paise end-to-end.
- **Type safety**: `tsc --noEmit` and ESLint both pass clean.

### Known follow-ups before submission
- Wire StoreKit 2 receipts to `subscriptions` and validate server-side.
- Replace console analytics with a consented, India-resident provider.
- Implement the Supabase repository reads in `profileStore.load()` prod path.
- Add VoiceOver labels to charts (Velocity dial / projection lines) and Dynamic
  Type review.

---

## 5. How to demo the upgrade

1. Launch in mock mode (no Supabase env needed) — loads the "Priya" persona.
2. **Home**: see your biggest mistake/opportunity, velocity dial, action plan,
   and a 10-year net-worth preview.
3. Tap the payday banner → **Payday Experience** (animated plan reveal).
4. Tap the velocity card → **Money GPS** (current vs recommended route).
5. Tap "Simulate" / a goal tile → **Future Self** (switch scenarios & horizons).
6. **Profile → Plan**: downgrade to **Free** to watch the paywalls and goal/route
   gating activate; upgrade back to Pro to unlock everything.
