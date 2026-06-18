# Elite Product Review — Salary Coach AI

_Reviewed and upgraded in "Financial OS" mode. This document records what the product is, what was changed in this pass, and the honest gaps that remain._

---

## 1. The thesis

Salary Coach AI is not a budgeting app. Budgeting apps look **backward** (categorize what you already spent). This product looks **forward**: it answers "what should I do with the money I'm about to receive, and what does each choice do to my future?"

The defensible core is a **deterministic financial engine**. The AI never invents a number — it calls the engine and narrates the result. That is the single most important architectural decision in the codebase and it is correct. It means every recommendation is reproducible, auditable, and trustworthy — the opposite of a hallucinating chatbot bolted onto a bank feed.

This pass doubled down on that thesis instead of diluting it.

---

## 2. What was upgraded in this pass

### Decision Engine (`services/engine/decision.ts`) — NEW
The old `analyzeAffordability` produced a one-line verdict. The new `evaluateDecision` is a genuine advisor:

- Weighs **four dimensions** a real planner weighs: cash-flow strain, goal delay, emergency-fund safety, and **5-year investment opportunity cost** (the money's foregone compounding).
- Produces a **0–100 confidence score** with an explicit verdict (`go` / `caution` / `wait`).
- Returns **smarter alternatives** (lean option, pay-cash-instead, auto-save plan).
- Carries a full **Trust** payload (reasoning, assumptions, risks).

This is the feature most likely to make a user say "I can't manage money without this."

### Trust Engine (`Trust` type, woven through decision + GPS) — NEW
Every high-stakes recommendation now ships with `reasoning[]`, `confidence`, `assumptions[]`, and `risks[]`. The Money GPS screen renders this verbatim. The user never has to wonder "why is the app telling me this?" — and confidence is computed from data completeness and financial margins, not vibes.

### Financial Memory (`services/engine/memory.ts` + `store/memoryStore.ts`) — NEW
The app now captures a **monthly snapshot** of the user's vitals (health, velocity, savings rate, SIP rate, net worth, debt, goals on track) and turns the history into a personal narrative: _"Three months ago you were saving 12%. Today you're saving 21%. Your consistency has improved significantly."_ Surfaced on the Insights tab and through the coach ("How am I improving?"). In demo mode it seeds a believable back-history so the feature is immediately demonstrable.

### Money GPS 2.0 (`services/engine/projection.ts`) — UPGRADED
Two routes became **four**: Current, Recommended, Aggressive, Safe — each with its own contribution shape, emergency-funding pace, goal ETAs, and 10-year net worth. The recommended route now ships with a Trust breakdown.

### Future Self 2.0 (`services/engine/projection.ts`) — UPGRADED
Added **15-year and dynamic retirement horizons**, a **projected retirement corpus**, and a new **"Next Raise (+20%)"** scenario (bank your appraisal instead of inflating lifestyle). The chart now derives its labels from the sampled points, so it stays correct as horizons change.

### Real persistence foundation (Phase 1) — NEW
- `services/supabase/repositories/` — typed row↔domain mappers and CRUD for users, financial profiles, goals, and blueprints, plus a single batched `fetchFullProfile` round-trip.
- `services/sync/queue.ts` — an **offline-first mutation queue** with exponential backoff, dead-lettering after 6 attempts, and AsyncStorage durability.
- Goal CRUD and onboarding commits now write **optimistically** to local state and enqueue durable background sync. Everything **no-ops in demo mode**, so the local experience is untouched.

---

## 3. Premium bar — screen-by-screen verdict

| Surface | Verdict | Note |
|---|---|---|
| Home (mission control) | **Strong** | Already best-in-class; payday CTA is the right hero. |
| Coach | **Strong+** | Now backed by the decision engine and memory recall. |
| Insights | **Strong+** | Money Memory card gives it a reason to be opened weekly. |
| Money GPS | **Elevated** | Four routes + trust reads like a wealth platform, not an app. |
| Future Self | **Elevated** | Retirement corpus makes the future tangible. |
| Payday | **Strong** | Signature moment; see Scale doc for the one missing piece (server-confirmed events). |
| Onboarding | **Strong** | 10 steps is at the upper limit — measure drop-off (see Scale doc). |

---

## 4. Honest remaining gaps (not yet done in this pass)

1. **Edge Function parity.** The Deno `ai-coach` function still has a simplified server-side affordability tool. It cannot import the TypeScript engine directly. The right fix is to extract the engine into a shared package consumable by both the app and Deno. Until then, the **mock provider is the smarter brain** — fine for demo, but production AI should reach parity.
2. **Memory → cloud.** Snapshots persist locally only. They map cleanly onto the existing `financial_scores` table; wiring `recordSnapshot` through a repository is a small, safe follow-up.
3. **Billing is still simulated.** Entitlement gating is real; StoreKit/RevenueCat is not. See Moat/Scale docs.
4. **No automated tests.** The engine is pure and deterministic — it is begging for a Jest suite. This is the highest-ROI quality investment available and should be next.

---

## 5. One-paragraph summary for an investor

> Salary Coach AI pairs a transparent, deterministic financial engine with an AI narrator, so every recommendation is reproducible and explainable. In this iteration we shipped a multi-dimensional Decision Engine with confidence scoring, a Trust layer that exposes the reasoning behind every recommendation, a longitudinal Financial Memory that lets the product reference a user's real trajectory over time, a four-route Money GPS, retirement-grade Future Self simulations, and an offline-first sync foundation. The result feels less like a budgeting app and more like a private wealth manager that fits in a pocket.
