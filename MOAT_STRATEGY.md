# Moat Strategy

Most personal-finance apps are commodities: they aggregate a bank feed and draw pie charts. Aggregation is not a moat — Plaid sells it to everyone. This document identifies where Salary Coach AI can build defensibility and which moats were advanced in this pass.

---

## The 5 candidate moats (ranked by ROI × defensibility)

### 1. The Decision Engine + Trust layer  ★ highest ROI — ADVANCED THIS PASS
A transparent engine that answers "should I do X?" across cash flow, goals, emergency safety, and opportunity cost — **with a confidence score and the reasoning exposed** — is genuinely hard to copy well. Anyone can prompt an LLM "can I afford this?"; almost nobody pairs it with a reproducible, auditable engine that shows its work.

- **Why defensible:** the moat is the *quality and trustworthiness* of the math, refined over thousands of real decisions, plus the brand of "the app that never lies to you."
- **Status:** shipped `evaluateDecision` with four dimensions, confidence, and Trust.
- **Next:** log every decision + outcome (the `recommendations` table exists) to tune confidence calibration — a data flywheel competitors can't replicate.

### 2. Financial Memory  ★ high ROI — ADVANCED THIS PASS
An app that remembers your trajectory ("you were saving 12%, now 21%") becomes a relationship, not a tool. Switching cost compounds: leaving means losing your financial story.

- **Why defensible:** longitudinal data the user accumulates only by staying. The longer they stay, the better and stickier it gets.
- **Status:** shipped monthly snapshot capture + narrative engine, surfaced in Insights and the coach.
- **Next:** persist snapshots server-side; let the coach cite specific past decisions ("when you skipped the ₹1.2L upgrade in March, that's now worth ₹1.4L").

### 3. Behavioral payday loop  ★ high ROI — EXISTS, protect it
The product's North Star (`recommendation_executed`) ties to the single highest-intent moment in a salaried person's month: payday. Owning that moment — allocation, warnings, goal acceleration — is a habit moat.

- **Why defensible:** habit + timing. Whoever owns payday owns the relationship.
- **Status:** payday experience exists and is strong.
- **Next:** server-scheduled payday notifications (the `notifications` table + cadence exist in schema) so the app *initiates* the moment.

### 4. India-native financial intelligence  ★ medium ROI — EXISTS
Old vs new tax regime, 80C/ELSS/PPF/EPF/NPS, lakh/crore formatting, India-specific goal presets and salary archetypes. Western apps get this wrong; it signals "built for me."

- **Why defensible:** localization depth + regulatory nuance is tedious to replicate and easy to get subtly wrong.
- **Next:** tax-regime optimizer as a first-class engine tool.

### 5. Future Self simulation  ★ medium ROI — ADVANCED THIS PASS
Making the future tangible (net worth and retirement corpus under different behaviors) is emotionally powerful and shareable.

- **Status:** extended to 15-year and retirement horizons with a projected corpus and a "bank your raise" scenario.
- **Next:** shareable "future self" cards — a viral/acquisition loop.

---

## Where to invest next (highest leverage)

1. **Close the decision → outcome data loop.** Persist each decision and what the user did. This calibrates confidence scores and produces a dataset no competitor has. _This is the real long-term moat._
2. **Server-side memory + proactive payday.** Move snapshots and payday triggers server-side so the app reaches out at the right moment with personalized, history-aware nudges.
3. **Engine-as-package.** Guarantees the AI (server) and the app (client) give identical, trustworthy answers — the foundation that makes the Trust moat real in production.

---

## What NOT to do

- **Do not become a bank-feed aggregator first.** It's a commodity and a compliance burden; it can come later as an input to the engine, not as the product.
- **Do not let the LLM compute numbers.** The moment numbers come from a model instead of the engine, the Trust moat evaporates.
- **Do not copy budgeting-app UI patterns** (category donuts, monthly spend recaps). The category-defining bet is *forward-looking decisions*, not *backward-looking accounting*.
