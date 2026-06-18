# Salary Coach AI — Product Blueprint

> **One line:** A personal CFO in your pocket for salaried India. It doesn't just track money — it tells you exactly what to do with your *next* paycheck.

**Document status:** v1.0 — buildable product specification
**Audience:** Founding team (Product, iOS, Backend, AI/ML, Design), early investors
**Scope:** iOS-first, India market

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [User Personas](#3-user-personas)
4. [Complete Feature List](#4-complete-feature-list)
5. [UX Design](#5-ux-design)
6. [Screen-by-Screen Breakdown](#6-screen-by-screen-breakdown)
7. [AI Architecture](#7-ai-architecture)
8. [Database Design](#8-database-design)
9. [Technical Architecture](#9-technical-architecture)
10. [Monetization](#10-monetization)
11. [Development Roadmap](#11-development-roadmap)
12. [Investor Pitch](#12-investor-pitch)

---

## 1. Executive Summary

**Salary Coach AI** is a mobile-first iOS app that acts as a personal Chief Financial Officer for salaried employees in India. Where Mint, Monarch, and YNAB report *what happened* to your money, Salary Coach AI prescribes *what to do next* — turning every paycheck into a personalized, explainable action plan.

The core insight: salaried Indians receive a predictable, recurring income event (payday) but make ad-hoc, emotional, and uninformed decisions about it. They juggle EPF, PPF, NPS, SIPs, ELSS, FDs, gold, EMIs, rent, family obligations, and tax planning — usually with no unified view and no guidance. The result is lifestyle inflation, under-saving, panic-driven investing, and the inability to escape paycheck-to-paycheck living even at high incomes.

Salary Coach AI solves this with:

- **The AI Salary Blueprint** — every paycheck is split into an optimized, explained allocation (needs, wants, savings, investments, debt, goals, tax) personalized to the user's life stage, risk profile, and behavior.
- **A conversational AI Coach** grounded in the user's *actual* financial data — answering "Can I afford a car?" or "How long until I buy a house?" with real numbers and trade-offs.
- **Proprietary scores** — a Financial Health Score and Wealth Velocity Score that make abstract financial progress legible and motivating.
- **Forward-looking simulation** — the Future Self Simulator and Life Event Planner show 1/3/5/10-year outcomes and prepare users for marriage, home, children, and retirement.
- **Behavioral guardrails** — a Lifestyle Inflation Detector and risk alerts that intervene *before* mistakes happen.

**Target market:** ~120M+ salaried individuals in India; an immediate beachhead of ~15–25M urban, English-comfortable, smartphone-first professionals (IT/ITES, BFSI, startups, corporates) with disposable income and unmet advisory needs.

**Business model:** Freemium subscription (Free / Pro ₹299/mo / Premium ₹599/mo) with an Enterprise (employer-sponsored financial wellness) tier. No selling of user data; optional, transparent affiliate revenue for genuinely suitable financial products.

**Why now:** UPI + Account Aggregator (AA) framework make consented, structured financial data programmatically available for the first time; LLMs make explainable, conversational, personalized advice economically viable at scale; and a generation of high-earning-but-under-advised professionals is actively seeking guidance that human advisors (₹5,000–₹50,000 fees, conflicts of interest) don't serve affordably.

---

## 2. Product Vision

### 2.1 The shift: from tracking to coaching

| Old finance apps | Salary Coach AI |
|---|---|
| "You spent ₹48,000 this month." | "You can safely spend ₹52,000 this month. Cap dining at ₹6,000." |
| "Here's a pie chart of categories." | "Move ₹10,000 from idle savings into your ELSS SIP before March 31 to save ₹3,100 in tax." |
| "Set a budget." | "Based on your salary, goals, and emergency fund, here's your budget — and why." |
| Backward-looking ledger. | Forward-looking command center. |
| Neutral, passive. | Opinionated, prescriptive, explainable. |

### 2.2 The feeling we are designing for

The user should feel like a competent, calm professional is handling their money strategy — someone who knows their whole situation, never judges, always explains, and is available 24/7. Apple Health for your financial body. The emotional target is **relief and control**, not anxiety or guilt.

### 2.3 North Star Metric

**Paycheck Decisions Executed** — the number of recommended allocation/action items a user actually completes per pay cycle. This captures the unique value (acting on advice), correlates with retention and outcomes, and is hard to game.

Supporting metrics: 60-second time-to-first-blueprint, monthly active coaching conversations, Financial Health Score improvement cohort-over-cohort, 30/90-day retention, free→paid conversion.

### 2.4 Design principles

1. **Prescribe, then explain.** Always lead with the recommendation; always make the "why" one tap away.
2. **60 seconds to value.** A user must know what to do with their next salary within a minute of opening the app on payday.
3. **Calm, not noisy.** Minimal surface, generous whitespace, no red-alert spam. Intervene only when it matters.
4. **India-native.** EPF/PPF/NPS/ELSS/SIP/80C/term-insurance literacy baked in; ₹ formatting in lakhs/crores; festival/bonus seasonality; family-first money culture.
5. **Trust over engagement.** No dark patterns, no data selling, no churn-driving manipulation. Advice quality and conflict-free positioning are the moat.
6. **Explainable by default.** Every number is traceable to inputs and assumptions the user can edit.

---

## 3. User Personas

### Persona 1 — "Aarav, the Fresh Graduate"
- **Age/role:** 22, first job at an IT services firm, Pune. ₹6.5L CTC (~₹42k in-hand/mo).
- **Situation:** First salary ever. Parents expect a contribution. No savings, no investments, lots of new spending temptations (phone EMI, OTT, dining).
- **Pain:** Doesn't know how much to save, what an SIP is, or whether he can afford a bike. Money disappears by month-end.
- **What he needs:** A simple blueprint, automatic savings nudges, jargon-free education, lifestyle inflation guardrails.
- **Success:** Builds a 3-month emergency fund and a ₹5,000 SIP within a year; stops running out of money.

### Persona 2 — "Priya, the Software Engineer"
- **Age/role:** 28, SDE-2 at a product startup, Bengaluru. ₹28L CTC + RSUs/ESOPs.
- **Situation:** High income, high lifestyle. Multiple SIPs started impulsively, ESOPs she doesn't understand, no tax optimization, vague goal of buying a flat.
- **Pain:** Earns a lot but doesn't feel "rich"; no clarity on whether she's on track; lifestyle inflation creeping; ESOP and tax confusion.
- **What she needs:** Optimization, tax planning, ESOP/RSU handling, a Future Self Simulator, "Can I afford X?" answers.
- **Success:** Clear home-down-payment timeline, optimized tax, rising Wealth Velocity Score.

### Persona 3 — "Rohan & Sneha, the Corporate Couple"
- **Age/role:** 34 & 32, manager + marketing lead, Gurugram. Combined ₹45L.
- **Situation:** Married, planning a child, home loan EMI of ₹65k, aging parents, one car loan.
- **Pain:** Competing goals (child, bigger home, parents' health), debt load, no coordinated plan, anxiety about "are we doing enough?"
- **What they need:** Life Event Planner (child), goal prioritization, debt strategy, joint/household view (future), insurance adequacy checks.
- **Success:** A funded child-planning corpus, optimized EMIs, adequate term + health cover, calm.

### Persona 4 — "Vikram, the High-Income Professional"
- **Age/role:** 41, senior director / doctor / VP, Mumbai. ₹80L+ income.
- **Situation:** Complex: multiple income streams, real estate, large portfolio, NPS, international exposure, kids' education abroad ambitions.
- **Pain:** Has a CA for taxes but no holistic strategy; wealth feels disorganized; wants to retire early (FIRE-adjacent).
- **What he needs:** Sophisticated forecasting, retirement/FIRE modeling, asset allocation guidance, scenario planning, Premium-tier depth.
- **Success:** A credible early-retirement date, optimized allocation, consolidated picture.

### Persona 5 — "Meena, Escaping Paycheck-to-Paycheck"
- **Age/role:** 30, ops executive, Hyderabad. ₹9L CTC, supporting parents and a sibling's education.
- **Situation:** Lives month-to-month despite a decent salary; high family obligations; one credit card revolving; no emergency fund.
- **Pain:** Stress, shame, no buffer, feels stuck, vulnerable to any income shock.
- **What she needs:** Debt-payoff plan, micro-savings automation, emergency fund first, gentle non-judgmental coaching, small wins/streaks.
- **Success:** Credit card cleared, 1-month buffer built, first positive net-worth month.

> **Design tension to honor:** Personas 1/5 need *simplicity and encouragement*; personas 2/4 need *depth and control*. The product must scale gracefully from "tell me what to do" to "show me the model and let me tweak assumptions."

---

## 4. Complete Feature List

### 4.1 Signature / differentiating features

1. **AI Salary Blueprint** — Per-paycheck optimized allocation across Needs / Wants / Emergency / Savings / Investments / Debt / Goals / Tax, with a one-tap "Why this?" explanation for every line. Re-computed each cycle and on any material change.
2. **Paycheck Command Center** — On payday, a step-by-step action plan ("Move ₹X to SIP", "Pay ₹Y on card", "Park ₹Z in liquid fund") with one-tap execution/reminders and a completion tracker (feeds North Star).
3. **Future Self Simulator** — Project net worth and key milestones at 1/3/5/10 years; compare scenarios (e.g., "if you keep this lifestyle" vs "if you raise SIP by ₹5k"); interactive sliders.
4. **Lifestyle Inflation Detector** — Detects when trailing spend growth outpaces income growth; flags category creep; quantifies the long-term cost ("this ₹4k/mo lifestyle bump = ₹38L less at retirement").
5. **Financial Health Score (0–100)** — Proprietary composite of emergency fund, savings rate, debt, insurance, diversification, goal funding. Transparent sub-scores.
6. **Wealth Velocity Score** — Measures *rate* of progress toward financial independence (not just balance). Rewards momentum; designed to be improvable by behavior.
7. **Salary DNA Profile** — Behavioral archetype classification (e.g., "The Sprinter", "The Hoarder", "The Tightrope Walker", "The Builder") driving tone and recommendation style.
8. **AI Coach (conversational)** — Chat grounded in the user's real data; answers affordability, trade-off, and planning questions with numbers and rationale.
9. **Life Event Planner** — Guided modules for marriage, home purchase, child, car, career break/sabbatical, parents' care, retirement/FIRE — each producing a funded plan.
10. **Goal Engine** — Create, prioritize, forecast, and track goals with probability-of-success and "what would make this faster" suggestions.

### 4.2 Core features

11. Onboarding & financial intake (manual + Account Aggregator-assisted).
12. Net worth tracker (assets, liabilities, trend).
13. Emergency fund planner & tracker (target = N months of essential spend).
14. Budget & spending limits (envelope-style, auto-derived from blueprint).
15. Investment overview (MF/SIP, stocks, EPF, PPF, NPS, FD/RD, gold, ESOP/RSU) — read/aggregate first; recommendations second.
16. Debt manager (EMIs, credit cards; avalanche/snowball strategies; prepayment advisor).
17. Tax planner (old vs new regime comparison, 80C/80D/NPS/HRA optimization, year-end nudges).
18. Insurance adequacy (term life & health cover gap analysis — advisory, not selling).
19. Insights feed (spending, savings, salary, wealth, behavior, forecasts).
20. Notifications & nudges engine (payday, bills, goal milestones, risk alerts, tax deadlines).
21. Gamification (levels, milestones, achievements, streaks).
22. Salary growth & appraisal planner (model raises, switches, bonuses).

### 4.3 Supporting features

23. Recurring bill & subscription detector.
24. Bonus/windfall planner (festival bonus, appraisal arrears, gifts).
25. Reports & shareable summaries (monthly review, annual wrap-up).
26. Education micro-content (contextual, just-in-time, India-specific).
27. Couples / household view (Phase 3+).
28. Security: biometric lock, privacy controls, data export/delete.
29. Reminders & calendar integration.
30. Multi-device sync (iOS first; iCloud-backed settings).

### 4.4 Explicitly out of scope (v1) — and why
- **Direct money movement / brokerage / fund execution** — heavy regulatory burden (RIA/RA, broker licenses). v1 advises and deep-links; execution is a later, partnered phase.
- **Android & web** — focus to nail iOS premium experience first.
- **Stock tips / market timing** — conflicts with our calm, conflict-free, plan-driven philosophy.

---

## 5. UX Design

### 5.1 Design language

- **Mood:** Calm, premium, confident. Closest references: Apple Health/Fitness (rings, scores, calm data viz), Wealthfront (clarity), Monarch (information density done elegantly).
- **Layout:** Card-based, generous spacing, strong hierarchy. One primary action per screen. Progressive disclosure — summary first, detail on tap.
- **Color:**
  - Neutral base (near-black `#0B0B0F` dark / off-white `#FAFAF8` light) so data and accents pop.
  - A single brand accent (deep teal/green `#0E8C6A` — money, growth, calm) used sparingly.
  - Semantic: positive green, caution amber, risk coral (never aggressive red unless truly urgent).
  - Score visualizations use a calm gradient (coral→amber→teal) rather than alarmist red/green binaries.
- **Typography:** SF Pro (system) — large rounded numerals for hero figures (₹ amounts, scores), clear text styles. Indian number formatting (₹1,25,000 / ₹1.25L / ₹2.4Cr) everywhere.
- **Motion:** Subtle, physics-based (springs), used to reveal cause→effect (e.g., dragging a slider animates the future net-worth line). Never decorative-only.
- **Dark mode:** First-class, default-respecting system setting.
- **Accessibility:** Dynamic Type, VoiceOver labels on all data, color-blind-safe palettes, min 4.5:1 contrast, haptics for key confirmations.

### 5.2 Signature UI components

- **Score Rings/Arc** — Financial Health Score as a hero arc with sub-score breakdown on tap (Apple-Fitness-like).
- **Allocation Bar** — Horizontal stacked bar showing the paycheck split; tap any segment for the "why".
- **Velocity Dial** — Wealth Velocity shown as a speedometer-style dial with a "to financial freedom" trajectory.
- **Future Line** — Interactive net-worth projection with scenario toggles and draggable assumption sliders.
- **Coach Bubble** — Persistent, contextual entry to the AI Coach from any screen (e.g., long-press a number → "Ask the Coach about this").

### 5.3 Navigation model

Bottom tab bar with **5 tabs** (improved from the proposed set):

| Tab | Purpose | Why |
|---|---|---|
| **Home** | Snapshot, scores, this month's allocation, top recommendations. | The 60-second answer lives here. |
| **Plan** | Goals + Life Events + Future Simulator + Emergency Fund. | Forward-looking planning consolidated (clearer than separate "Goals" + scattered planners). |
| **Coach** (center, emphasized) | Conversational AI + Paycheck Command Center. | The differentiator deserves the prominent center slot. |
| **Insights** | Spending, savings, salary/wealth trends, behavior analysis. | Backward-looking understanding. |
| **Profile** | Accounts, data, subscription, security, settings. | Standard home for identity/config. |

> Rationale for change vs. the suggested "Home/Coach/Goals/Insights/Profile": "Goals" alone undersells the planning surface. **Plan** absorbs goals, life events, emergency fund, and simulation into one coherent forward-looking pillar, while **Coach** becomes the hero center tab combining chat + payday command center.

---

## 6. Screen-by-Screen Breakdown

### 6.1 Onboarding flow (the most important funnel)

**Goal:** Deliver a real, personalized Salary Blueprint in ≤60 seconds of *perceived* effort, with progressive depth afterward. Use a conversational, one-question-per-screen pattern (Cal/Typeform-style) with a progress indicator and "why we ask" microcopy to build trust.

**O0 — Splash / value prop carousel (3 cards, skippable)**
- Card 1: "Most apps track your money. We coach it." 
- Card 2: "Tell us about your salary. Get a plan in 60 seconds."
- Card 3: "Your data is yours. Encrypted. Never sold."
- CTA: *Get Started* / *I already have an account*.

**O1 — Account creation**
- Sign in with Apple (primary), Phone OTP (secondary), Email.
- Minimal friction; defer profile detail.

**O2 — The promise + expectation set**
- "Answer a few questions. The more you share, the smarter your coach. You can skip anything and refine later."

**O3 — Salary collection**
- Monthly in-hand salary (hero numeric input with ₹ formatting; toggle: in-hand vs CTC with auto-estimate).
- Pay date (used for Command Center timing).
- Variable pay/bonus frequency (optional).

**O4 — Salary growth expectations**
- Expected annual increment (slider, default ~8–10%).
- Next appraisal month (optional).
- Career trajectory tag (steady / fast-growth / variable).

**O5 — Expense collection**
- Smart defaults by income band, then quick-edit: Rent/EMI, Food, Transport, Utilities/Bills, Subscriptions, Family support, Discretionary.
- Option: "Connect accounts to auto-detect" (Account Aggregator) — *can be deferred*.

**O6 — Existing savings & emergency fund**
- Bank balance / liquid savings.
- "If income stopped today, how many months could you cover?" → seeds emergency fund status.

**O7 — Investments**
- Quick checklist: EPF, PPF, NPS, Mutual funds/SIP (amount), Stocks, FD/RD, Gold, ESOP/RSU, Real estate, Crypto.
- Approximate amounts; AA-assisted import optional.

**O8 — Debts**
- Home loan, car loan, personal loan, credit card outstanding, education loan, BNPL.
- For each: balance, EMI, interest rate (optional).

**O9 — Family responsibilities**
- Marital status, dependents (kids/parents/siblings), monthly family support amount.
- Single earner vs dual income.

**O10 — Financial goals (pick + prioritize)**
- Multi-select common goals: Emergency fund, Buy home, Buy car, Marriage, Travel, Child education, Retirement/FIRE, Start business, Debt-free.
- For top 1–3: rough target amount + timeline.

**O11 — Risk tolerance**
- 3–5 scenario questions (e.g., "Your investment drops 20% in a month — you…") → maps to Conservative / Balanced / Aggressive, age-adjusted.

**O12 — Financial Personality Quiz (→ Salary DNA)**
- 5–7 behavioral questions (spender/saver tendencies, planning horizon, money emotions) → assigns Salary DNA archetype with a shareable, flattering-but-honest result card.

**O13 — AI setup / consent**
- Explain what the AI does with their data, on-device vs cloud processing, opt-ins for notifications and (optional) account aggregation.
- Privacy commitments restated.

**O14 — "Building your blueprint…" (delightful compute moment)**
- Animated synthesis screen referencing their actual inputs ("Analyzing your ₹X salary… checking your 2.5-month emergency buffer… optimizing for your home goal…"). 3–6s, builds perceived value.

**O15 — First Salary Blueprint reveal**
- Hero: the allocation bar + Financial Health Score + the single most important recommendation.
- "Here's what to do with your next salary." → 3 prioritized actions.
- CTA into Home. Soft paywall awareness (not a hard wall) — value first.

> **Funnel principles:** every screen skippable; smart defaults so a user can finish in <60s by accepting defaults; depth rewarded but never required; show partial value early (e.g., a provisional score after O6).

### 6.2 Home tab

Top→bottom, card-based, scrollable:

1. **Salary Snapshot (hero)** — Current cycle: in-hand salary, days to next payday, "safe to spend so far / remaining". Tap → cycle detail.
2. **Financial Health Score arc** — 0–100 with trend arrow and one-line takeaway. Tap → sub-score breakdown (Emergency, Savings rate, Debt, Insurance, Diversification, Goal funding).
3. **Wealth Velocity dial** — Momentum toward financial freedom + "at this pace, financial independence by 20XX". Tap → drivers + how to improve.
4. **This Month's Allocation bar** — The blueprint split; tap segment → amount + why + linked action.
5. **Top Recommendations (1–3 cards)** — Prioritized, each with impact ("saves ₹3,100 tax"), effort, and a CTA (Do it / Remind me / Why?).
6. **Goal Progress** — Carousel of active goals with % funded and on-track/at-risk pill.
7. **Emergency Fund Progress** — Months-covered ring vs target.
8. **Upcoming Risks** — Lifestyle inflation flag, big bill due, low-buffer warning, tax deadline. Calm, max 2 surfaced.
9. **Coach prompt** — "Ask me anything about your money →".

Interactions: pull-to-refresh recomputes; long-press any number → "Ask the Coach"; everything tappable drills to detail with the assumptions editable.

### 6.3 Plan tab

- **Segmented header:** Goals · Life Events · Simulator · Emergency Fund.
- **Goals view:** list with priority order (drag to reorder), each card showing target, timeline, monthly contribution, probability-of-success, and "make it faster" suggestion. FAB → create goal (guided: type → amount → date → funding source → forecast).
- **Life Events view:** tiles (Marriage, Home, Child, Car, Sabbatical, Parents' care, Retirement/FIRE). Tap → guided planner producing a funded sub-plan and goals.
- **Simulator view:** Future Self — interactive net-worth line, scenario chips ("Current path", "+₹5k SIP", "Buy car now", "Job switch +30%"), draggable assumption sliders (savings rate, returns, inflation, salary growth). Side-by-side scenario compare.
- **Emergency Fund view:** target months selector, current coverage, monthly plan to close the gap, recommended parking (liquid/sweep FD).

### 6.4 Coach tab (center, hero)

- **Two modes via top toggle:** *Command Center* (payday action plan) and *Chat* (conversational).
- **Command Center (default near payday):**
  - "It's payday — here's your plan for this ₹X." 
  - Ordered checklist of actions (pay card → fund emergency → SIP → goal transfers → discretionary cap), each with amount, rationale, and one-tap *Mark done* / *Set reminder* / deep-link to the relevant app/bank.
  - Progress ring of plan completion (North Star).
- **Chat:**
  - Suggested prompts: "Can I afford a ₹12L car?", "Should I increase my SIP?", "How much should I save?", "Can I take a ₹1.5L vacation?", "How long until I can buy a house?"
  - Answers are grounded, numeric, and show trade-offs ("Yes, but it pushes your home down-payment from Mar-2028 to Nov-2028 — here are 2 alternatives"). 
  - Inline mini-charts; "Apply this to my plan" buttons; citations to the user's own data ("based on your ₹85k surplus and 2.3-month buffer").

### 6.5 Insights tab

- **Insight feed** (cards, newest/most-relevant first), each: headline + one chart + one recommended action.
  - Spending insights (category trends, anomalies, subscription creep).
  - Savings insights (savings rate trend vs target, best/worst months).
  - Salary trends (income growth vs plan, raise impact).
  - Wealth trends (net-worth trajectory, asset mix drift).
  - Behavior analysis (Salary DNA in action, lifestyle inflation, impulse patterns).
  - Forecasts (cash-flow next 3 months, year-end tax position).
- Filter chips by theme; "Ask the Coach about this" on every card.

### 6.6 Profile tab

- Identity & Salary DNA badge.
- Connected accounts (AA) & manual accounts management.
- Subscription/plan & billing.
- Security (Face ID lock, data export, delete account).
- Notification preferences (granular).
- Assumptions & defaults (returns, inflation, retirement age) — power-user controls.
- Help, education library, support, legal/disclaimers.

---

## 7. AI Architecture

### 7.1 Philosophy: deterministic core, AI for reasoning & language

The AI does **not** invent the math. A deterministic **Financial Engine** computes allocations, scores, forecasts, and tax outcomes from rules and the user's data. The **LLM layer** explains, personalizes tone, handles natural-language Q&A, and proposes options — always citing engine outputs. This keeps advice accurate, auditable, compliant, and cheap.

```
User data ──► Financial Engine (deterministic) ──► structured results (allocations, scores, forecasts)
                                                          │
                                                          ▼
                              LLM layer (explain / converse / personalize) ──► user-facing language
```

### 7.2 Component overview

1. **Recommendation Engine (deterministic)**
   - Inputs: income, expenses, savings, investments, debts, goals, risk, family, emergency status, tax regime.
   - Logic: rule hierarchy — (a) clear high-interest debt, (b) build emergency fund to target, (c) capture tax-advantaged/matched savings (EPF/NPS/80C), (d) fund prioritized goals, (e) invest surplus per risk-based asset allocation, (f) cap discretionary to prevent lifestyle inflation.
   - Output: ordered, explainable allocation + actions with computed impact.
2. **Personalization Engine**
   - Salary DNA archetype + risk profile + life stage modulate *defaults, tone, and aggressiveness* (not correctness). E.g., "Hoarder" gets nudged to invest idle cash; "Sprinter" gets stronger lifestyle-inflation guardrails.
3. **Forecasting/Simulation Engine (deterministic)**
   - Monte-Carlo-lite projections for net worth/goals using configurable return/inflation/salary-growth assumptions; produces probability-of-success and scenario deltas.
4. **Scoring Engine (deterministic)**
   - Financial Health Score and Wealth Velocity Score from transparent weighted sub-metrics (see §8.9).
5. **LLM Reasoning & Conversation layer**
   - Grounds every answer in engine outputs + retrieved user facts; never fabricates numbers; declines/deflects out-of-scope (e.g., specific stock tips) per policy.

### 7.3 Prompt architecture (layered)

- **System prompt (static):** role ("You are a calm, expert personal CFO for salaried Indians"), India financial knowledge guardrails, tone, hard rules ("never invent numbers; only use provided FINANCIAL_CONTEXT; never recommend specific securities; always show trade-offs; surface assumptions; encourage, never shame").
- **Policy/compliance prompt:** disclaimers, scope boundaries, escalation phrasing ("this is educational guidance, not a SEBI-registered recommendation").
- **Financial context block (dynamic, structured):** a compact JSON of the user's current state + latest engine outputs (allocation, scores, surplus, goals, buffers, assumptions). This is the grounding source of truth.
- **Conversation memory (summarized):** rolling summary of prior chats + key decisions + stated preferences.
- **User message.**
- **Tool results (when used):** engine function-call outputs (e.g., `simulate_purchase(car, 1200000)` → impact on goals/cash flow).

### 7.4 Context architecture

- **Retrieval:** before answering, assemble (a) the latest deterministic engine snapshot, (b) relevant historical facts (RAG over the user's own transactions/insights), (c) conversation summary. Keep token budget tight; prefer structured facts over raw history.
- **Tool/function calling:** the LLM calls engine functions for any quantitative claim: `compute_allocation`, `affordability_check(item, cost, financing)`, `simulate_scenario(params)`, `score_breakdown`, `goal_forecast(goal_id)`, `tax_optimize(regime)`. The model composes the narrative; numbers come from tools.

### 7.5 Long-term memory strategy

- **Tiers:**
  1. *Structured profile & financials* (source of truth, in DB).
  2. *Decision log* (advice given, what user accepted/rejected, outcomes) — enables continuity ("last month you chose to delay the car").
  3. *Conversation summaries* (periodically compressed; raw recent turns kept short-term).
  4. *Preference/persona memory* (Salary DNA, communication style, sensitivities).
- **Write policy:** after each session, extract durable facts/decisions → upsert to memory; avoid storing transient chatter.
- **Privacy:** memory is user-scoped, encrypted, exportable/deletable; sensitive raw data stays in the DB, not in prompts beyond the minimal context block.

### 7.6 How the AI should "think" (worked example)

> User: *"Can I afford a ₹12L car?"*
1. LLM recognizes a quantitative affordability question → calls `affordability_check(item="car", cost=1200000)`.
2. Engine computes: down-payment options, EMI vs surplus, impact on emergency buffer, delay to home goal, total interest, depreciation.
3. Engine returns structured deltas + a recommendation flag (e.g., "feasible with ₹3L down + ₹18k EMI, but delays home goal by 8 months; recommend ₹8L used/lower-EMI alternative").
4. LLM renders a calm, numeric answer with the trade-off and 2 alternatives, plus an "Apply to plan / Simulate" button. No fabricated figures; all cite engine output and stated assumptions.

### 7.7 Safety, quality, cost
- **Guardrails:** scope filter (no specific securities/market timing), regulatory disclaimers, hallucination prevention via tool-only numbers, refusal patterns, and a "confidence + assumptions" footer.
- **Evaluation:** golden-set Q&A regression tests, numeric-consistency checks (LLM answer must match engine output), red-team prompts, human review sampling.
- **Cost control:** deterministic engine handles heavy lifting; LLM calls use compact context, caching of static prompts, smaller models for classification/routing and a frontier model only for complex reasoning.

---

## 8. Database Design

Relational core (PostgreSQL). Conventions: UUID PKs, `created_at`/`updated_at` timestamps, soft deletes (`deleted_at`) where relevant, monetary values stored as integer **paise** (`bigint`) to avoid float errors, currency `INR`, all tables `user_id`-scoped with row-level security.

### 8.1 `users`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| auth_provider | enum(apple,phone,email) | |
| email | text (nullable, unique) | |
| phone | text (nullable, unique) | |
| display_name | text | |
| date_of_birth | date | drives age-based logic |
| marital_status | enum | |
| dependents | jsonb | {kids,parents,siblings,...} |
| risk_profile | enum(conservative,balanced,aggressive) | |
| salary_dna_archetype | text | |
| tax_regime | enum(old,new) | |
| pay_day_of_month | smallint | |
| city / tier | text | cost-of-living context |
| subscription_tier | enum(free,pro,premium,enterprise) | |
| onboarding_completed_at | timestamptz | |
| locale / currency | text | default INR |
| created_at / updated_at / deleted_at | timestamptz | |

### 8.2 `income`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| type | enum(salary,bonus,variable,rental,other) | |
| amount_paise | bigint | |
| in_hand vs ctc | enum | |
| frequency | enum(monthly,quarterly,annual,one_time) | |
| expected_growth_pct | numeric | |
| effective_from / to | date | salary history over time |
| source_label | text | |

### 8.3 `expenses`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| category | enum(rent,emi,food,transport,utilities,subscriptions,family_support,health,discretionary,other) | |
| amount_paise | bigint | |
| is_recurring | bool | |
| is_essential | bool | needs vs wants |
| period | enum(monthly,...) | |
| detected_via | enum(manual,aggregator) | |
| txn_ref | uuid (nullable) | links to raw transaction |
| occurred_on | date | |

### 8.4 `transactions` (raw, when AA-connected)
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| account_id | uuid (FK) | |
| amount_paise | bigint | signed (+credit/−debit) |
| merchant / description | text | |
| category | text | auto-categorized |
| occurred_on | timestamptz | |
| raw | jsonb | source payload |

### 8.5 `accounts` (linked financial accounts)
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| kind | enum(bank,card,loan,investment,epf,ppf,nps,...) | |
| provider | text | |
| masked_number | text | |
| balance_paise | bigint | |
| aggregator_consent_id | text (nullable) | AA linkage |
| last_synced_at | timestamptz | |

### 8.6 `savings`
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| bucket | enum(liquid,emergency,goal_linked,fd,rd,other) | |
| amount_paise | bigint | |
| goal_id | uuid (nullable FK) | |
| interest_rate | numeric | |
| as_of | date | |

### 8.7 `investments`
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| asset_class | enum(mf,equity,epf,ppf,nps,fd,rd,gold,esop,rsu,real_estate,crypto,other) | |
| instrument_name | text | |
| current_value_paise | bigint | |
| invested_value_paise | bigint | |
| sip_amount_paise | bigint (nullable) | |
| sip_day | smallint (nullable) | |
| expected_return_pct | numeric | |
| risk_band | enum | |
| as_of | date | |

### 8.8 `debts`
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| type | enum(home,car,personal,education,credit_card,bnpl,other) | |
| principal_outstanding_paise | bigint | |
| emi_paise | bigint | |
| interest_rate | numeric | |
| tenure_months_remaining | int | |
| due_day | smallint | |

### 8.9 Scores: `financial_health_scores` & `wealth_velocity_scores`
**`financial_health_scores`**
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| score | smallint (0–100) | |
| sub_scores | jsonb | {emergency, savings_rate, debt, insurance, diversification, goal_funding} each 0–100 with weight |
| computed_at | timestamptz | snapshot for trend |
| inputs_snapshot | jsonb | reproducibility |

**`wealth_velocity_scores`**
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| score | smallint | |
| net_worth_growth_rate | numeric | trailing |
| savings_momentum | numeric | |
| projected_fi_date | date | financial-independence estimate |
| computed_at | timestamptz | |

### 8.10 `goals`
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| type | enum(emergency,home,car,marriage,travel,child_education,retirement,business,debt_free,custom) | |
| name | text | |
| target_amount_paise | bigint | |
| target_date | date | |
| current_amount_paise | bigint | |
| priority | smallint | user-ordered |
| monthly_contribution_paise | bigint | |
| probability_of_success | numeric | from forecaster |
| status | enum(on_track,at_risk,achieved,paused) | |
| linked_life_event_id | uuid (nullable) | |

### 8.11 `life_events`
| id, user_id | type enum(marriage,home,child,car,sabbatical,parents_care,retirement) | params jsonb (timeline, est. cost, assumptions) | generated_goal_ids uuid[] | status |

### 8.12 `recommendations`
| column | type | notes |
|---|---|---|
| id, user_id | uuid | |
| cycle_id | uuid (FK) | which paycheck cycle |
| category | enum(debt,emergency,investment,tax,savings,spending_limit,goal,insurance,behavior) | |
| title / body | text | |
| amount_paise | bigint (nullable) | |
| rationale | jsonb | the "why" (inputs + rule fired) |
| impact_estimate | jsonb | e.g., tax saved, goal delta |
| priority | smallint | |
| status | enum(suggested,accepted,dismissed,done,snoozed) | feeds North Star |
| acted_at | timestamptz | |

### 8.13 `paycheck_cycles`
| id, user_id | period_start/end date | income_paise | allocation jsonb (the blueprint split) | actions_total / actions_done int | created_at |

### 8.14 `insights`
| id, user_id | theme enum(spending,savings,salary,wealth,behavior,forecast) | headline | body | chart_spec jsonb | severity enum | relevance_score | created_at | read_at |

### 8.15 `ai_conversations` & `ai_messages`
**`ai_conversations`:** id, user_id, mode enum(chat,command_center), summary text, started_at, last_msg_at.
**`ai_messages`:** id, conversation_id, role enum(user,assistant,tool,system), content text, tool_name text (nullable), tool_payload jsonb (nullable), tokens int, model text, created_at.
**`ai_memory`:** id, user_id, kind enum(decision,preference,fact,summary), content text, embedding vector, source_conversation_id, created_at — long-term memory store (pgvector).

### 8.16 `notifications`
| id, user_id | type enum(payday,bill_due,goal_milestone,risk_alert,tax_deadline,streak,coaching) | title/body | scheduled_for | sent_at | channel enum(push,inapp) | status | deep_link | payload jsonb |

### 8.17 `gamification`
**`achievements`:** id, code, name, description, criteria jsonb, tier.
**`user_achievements`:** user_id, achievement_id, unlocked_at.
**`user_progress`:** user_id, level, xp, streak_current, streak_longest, last_active_on, milestones jsonb.

### 8.18 `assumptions`
Per-user overridable defaults: expected_return_equity/debt, inflation_pct, salary_growth_pct, retirement_age, emergency_months_target, fi_target_corpus_paise. (System defaults if unset.)

### 8.19 Relationships (summary)
`users` 1—N everything. `goals` ↔ `life_events` (M:1). `recommendations`/`paycheck_cycles` linked. `transactions`→`expenses`/`accounts`. `ai_conversations` 1—N `ai_messages`; `ai_memory` user-scoped. Time-series snapshots for scores enable trends.

### 8.20 Scale & integrity
- Index on `(user_id, created_at)` for all time-series tables; partition large tables (`transactions`, `ai_messages`) by month at scale.
- Money as integer paise; never float. Append-only score/cycle snapshots for auditability.
- RLS so every query is user-scoped by default. PII encrypted at rest; AA consent artifacts stored separately with strict access.

---

## 9. Technical Architecture

### 9.1 iOS app
- **Language/UI:** **Swift + SwiftUI** (with selective UIKit interop for complex charts). *Why:* native performance, premium feel, best-in-class animations/haptics, Dynamic Type/accessibility, smaller team velocity for a single-platform-first strategy. (React Native/Flutter rejected for v1 because the premium, animation-rich, Apple-Health-like experience is the product, and we're iOS-only first.)
- **Architecture:** MVVM + unidirectional data flow; Swift Concurrency (async/await); modularized via Swift Packages (Feature modules + Core/Networking/DesignSystem).
- **Local storage:** SwiftData/Core Data for offline cache + Keychain for secrets; on-device computation of the deterministic engine where feasible for instant, private results.
- **Charts:** Swift Charts (native) + custom Canvas for signature visualizations (rings, dials, future-line).
- **Design system:** shared tokens (color, type, spacing, motion) as a package; light/dark; reusable Score/Allocation/Velocity components.

### 9.2 Backend
- **Language/framework:** **TypeScript on Node (NestJS)** *or* **Python (FastAPI)**. Recommend **TypeScript/NestJS** for shared types with future web, strong structure, and ecosystem — *unless* the team's ML strength favors Python/FastAPI (excellent for the Financial Engine + AI orchestration). Pick one; both are defensible.
- **API:** REST + JSON (versioned) for app↔server; consider GraphQL later if client data needs get complex. WebSocket/SSE for streaming Coach responses.
- **Services (modular monolith → microservices later):**
  - `auth` (Apple/phone/email, JWT/session).
  - `financial-engine` (deterministic allocation, scoring, forecasting, tax) — pure, testable, versioned.
  - `ai-orchestrator` (prompt assembly, tool-calling to engine, memory, streaming).
  - `aggregation` (Account Aggregator integration, categorization).
  - `notifications` (scheduling, push).
  - `billing` (subscriptions/IAP, entitlements).
  - `analytics-ingest`.

### 9.3 Database & infra
- **Primary DB:** **PostgreSQL** (managed — e.g., Supabase/RDS/Cloud SQL) with **pgvector** for AI memory embeddings, RLS for tenant isolation.
- **Cache/queue:** Redis (sessions, rate limits, hot reads) + a job queue (BullMQ/Celery) for nightly score/insight recomputation and notification scheduling.
- **Object storage:** S3/GCS for reports/exports.
- **Hosting:** containerized (Docker) on a managed platform (AWS ECS/Fargate, GCP Cloud Run, or Render/Fly for early stage). **Data residency in India** (regulatory + latency) — AWS Mumbai / GCP Mumbai/Delhi.
- **IaC & CI/CD:** Terraform; GitHub Actions; staged environments (dev/staging/prod).

### 9.4 Authentication & security
- **Auth:** Sign in with Apple (primary), Phone OTP (India-friendly), email fallback; JWT access + refresh; biometric (Face ID) app lock.
- **Security:** TLS everywhere; encryption at rest (DB + field-level for PII); secrets in a vault; least-privilege; audit logs; RLS; SOC2-readiness roadmap; DPDP Act (India) compliance; AA consent management; no third-party data selling.
- **Privacy:** data export & delete; clear consent; minimize PII sent to LLM (only the structured context block).

### 9.5 AI providers
- **Strategy:** provider-abstraction layer (swap models without app changes).
- **Reasoning model:** a frontier LLM (e.g., GPT-class / Claude-class) for the Coach's complex reasoning, behind our tool-calling guardrails.
- **Routing/classification & cheap tasks:** smaller/faster model (categorization, intent routing, summarization) to control cost/latency.
- **Embeddings:** for `ai_memory`/RAG (pgvector).
- **Where possible, on-device:** the deterministic engine runs locally for instant scores; LLM stays server-side for control and updates.
- **Eval/observability:** prompt/version tracking, response logging (privacy-scrubbed), numeric-consistency tests, cost dashboards.

### 9.6 Push notifications & analytics
- **Push:** APNs via a provider (Firebase Cloud Messaging or OneSignal) for scheduling/segmentation; deep links to the relevant screen.
- **Analytics:** product analytics (Amplitude/PostHog) for funnels/retention/North Star; crash reporting (Sentry); privacy-respecting, consented, India-resident where required.
- **Experimentation:** feature flags + A/B (PostHog/LaunchDarkly) for onboarding and paywall optimization.

### 9.7 Account Aggregator (India-specific)
- Integrate via an AA TSP (Technology Service Provider) (e.g., Setu/Finvu/Anumati) to fetch consented bank/investment data — the structural unlock for automation. Manual entry always available as fallback (and for v1 launch before AA certification completes).

### 9.8 Why this stack (summary)
- **SwiftUI:** the premium native experience *is* the product; iOS-first focus.
- **PostgreSQL + pgvector:** one robust store for relational finance data *and* AI memory; strong integrity for money.
- **Deterministic engine + abstracted LLM:** accuracy, compliance, and cost control; future-proof against model churn.
- **India data residency + AA + DPDP:** regulatory fit and the data moat.

---

## 10. Monetization

**Model:** Freemium subscription (annual & monthly), no data selling. Optional, clearly-labeled affiliate revenue only for genuinely suitable products (e.g., term insurance) — never influencing core advice. Subscriptions via Apple IAP (StoreKit 2).

### 10.1 Tiers

| | **Free** | **Pro — ₹299/mo (₹2,499/yr)** | **Premium — ₹599/mo (₹4,999/yr)** | **Enterprise (B2B2C)** |
|---|---|---|---|---|
| Salary Blueprint | Basic (single allocation) | Full + explanations + re-optimization | Full + advanced strategies | Org-wide |
| Paycheck Command Center | View only | Full with reminders & tracking | Full | Full |
| Financial Health Score | ✅ | ✅ + sub-scores & history | ✅ + benchmarks | ✅ |
| Wealth Velocity Score | Locked/teaser | ✅ | ✅ + FIRE modeling | ✅ |
| AI Coach | 5 messages/mo | Unlimited core Q&A | Unlimited + deep planning + priority model | Unlimited |
| Goals | 1 active | Unlimited | Unlimited + advanced forecasting | Unlimited |
| Future Self Simulator | 1 scenario | Multi-scenario | Unlimited + Monte Carlo | ✅ |
| Life Event Planner | 1 event | All events | All + advanced (FIRE, estate basics) | ✅ |
| Account Aggregator sync | Manual only | ✅ | ✅ | ✅ |
| Tax planner | Basic regime compare | Full optimization | Full + scenario | ✅ |
| Insights | Limited | Full | Full + behavioral deep-dives | Aggregate org insights |
| Support | Community | Standard | Priority | Dedicated CSM |

### 10.2 Pricing strategy
- **Anchor on value vs. alternatives:** a fee-only human advisor costs ₹5,000–₹50,000+; Pro at ₹299/mo (<₹10/day) is a no-brainer comparison the onboarding/paywall should make explicit.
- **Annual-first:** push annual (~30% discount) to improve LTV and retention; 7-day free trial of Pro.
- **Value-gated, not crippled:** Free must deliver a real first blueprint + score (the hook); paywall the *ongoing optimization, automation, and depth* (the habit).
- **Trigger paywall at "aha" moments:** after the first blueprint reveal, when adding a 2nd goal, when asking the Coach a 6th question, when unlocking Velocity Score.
- **Premium for high-income personas** (₹599) justified by FIRE modeling, Monte Carlo, advanced life events, priority AI.
- **Enterprise:** employer-sponsored financial wellness — per-seat (₹50–₹150/employee/mo) sold to HR as a retention/productivity benefit; privacy-preserving aggregate dashboards only (never individual data to employer). Strong distribution channel given India's large organized-sector workforce.
- **Affiliate (optional, transparent):** suitability-checked term/health insurance, NPS onboarding — disclosed, never altering core recommendations.

### 10.3 Unit economics intuition
- Target blended ARPU (paying users) ~₹250/mo; LLM/infra cost per active user kept low by the deterministic engine + model routing. Path to healthy gross margins once AA + engine reduce per-query LLM reliance.

---

## 11. Development Roadmap

> Effort estimates assume a lean team (2 iOS, 2 backend, 1 AI/ML, 1 designer, 1 PM). "Complexity" is relative engineering risk.

### Phase 1 — MVP (Months 0–3) · Complexity: Medium · Effort: ~3 months
**Goal:** Prove the core loop — onboarding → first Salary Blueprint → Health Score → basic Coach.
- Onboarding flow (manual intake, O0–O15).
- Deterministic Financial Engine v1 (allocation rules, Financial Health Score).
- Home tab (snapshot, score arc, allocation bar, top recommendations).
- Salary Blueprint + basic Paycheck Command Center (manual mark-done).
- AI Coach v1 (grounded Q&A, tool-calling to engine; limited free messages).
- 1 goal + emergency fund tracker.
- Auth (Apple/phone), Postgres, push notifications (payday), basic analytics.
- Monetization scaffolding (Free + Pro paywall, IAP).
**Success:** 60-sec time-to-blueprint; users complete payday actions; early retention signal.

### Phase 2 — Depth & Retention (Months 3–6) · Complexity: Medium-High · Effort: ~3 months
- Wealth Velocity Score; Salary DNA archetypes; full sub-score breakdowns + history.
- Goals system full (multi-goal, prioritization, forecasting, probability-of-success).
- Insights feed (spending/savings/salary/wealth/behavior) + Lifestyle Inflation Detector.
- Future Self Simulator (interactive scenarios).
- Gamification (levels, streaks, achievements, milestones).
- Tax planner (old vs new, 80C/NPS/HRA).
- Notifications/nudges engine maturity; Premium tier launch.

### Phase 3 — Automation & Data (Months 6–10) · Complexity: High · Effort: ~4 months
- **Account Aggregator integration** (auto-import income/expenses/investments) — the automation unlock.
- Auto transaction categorization; recurring/subscription detection.
- Investment & debt managers (full), net-worth auto-tracking.
- Life Event Planner (marriage, home, child, car, retirement).
- AI long-term memory + RAG over user history; Coach "apply to plan" actions.
- Insurance adequacy advisor.

### Phase 4 — Scale & Sophistication (Months 10–15) · Complexity: High · Effort: ~5 months
- FIRE/retirement modeling, Monte Carlo forecasting (Premium).
- Couples/household view.
- ESOP/RSU modeling; advanced tax scenarios.
- Enterprise (B2B2C) financial wellness portal + aggregate dashboards.
- Personalization/ML improvements; experimentation platform; performance & cost optimization.

### Phase 5 — Ecosystem & Expansion (Months 15–24+) · Complexity: Very High · Effort: ongoing
- Execution partners (deep-link → invest/insure/transfer; possible RIA/RA path or partnerships).
- Android + web (broaden TAM).
- Open API / integrations; advisor-assist (human-in-the-loop premium).
- Regional language support; deeper India coverage (tier-2/3).
- Marketplace (suitability-checked products), bank/employer distribution deals.

---

## 12. Investor Pitch

### 12.1 Problem
India has 100M+ salaried workers who receive predictable paychecks but make poor, ad-hoc decisions with them. Even high earners feel stuck paycheck-to-paycheck due to lifestyle inflation, fragmented finances (EPF/PPF/NPS/SIP/ELSS/FD/EMIs/insurance/tax spread across silos), and an advice gap: quality human financial advisors are expensive (₹5,000–₹50,000+), conflicted (commission-driven), and inaccessible to the mass-affluent. Existing apps only *track* spending — they answer "what happened," never "what should I do."

### 12.2 Solution
**Salary Coach AI** — a personal CFO in your pocket. It turns every paycheck into an optimized, explained action plan; answers real questions ("Can I afford a car? When can I buy a house?") using the user's actual data; quantifies financial strength (Health Score) and momentum (Wealth Velocity Score); simulates the user's financial future; and intervenes before mistakes (Lifestyle Inflation Detector). Prescriptive, explainable, conflict-free, and available 24/7 for less than ₹10/day.

### 12.3 Market opportunity
- **TAM:** 100M+ salaried Indians; broader 400M+ workforce over time.
- **SAM (beachhead):** ~15–25M urban, smartphone-first, English-comfortable professionals (IT/ITES, BFSI, startups, corporates) with disposable income and acute advisory need.
- **SOM (early):** capture 1–2M paying subscribers → at ~₹250/mo ARPU, ₹300–600 Cr ARR potential, before Enterprise and affiliate lines.
- **Tailwinds:** rising incomes, financialization of savings (mutual fund SIPs at record highs), UPI ubiquity, the Account Aggregator framework (consented data rails), DPDP regulatory clarity, and LLMs making personalized advice economical.

### 12.4 Competitive advantage
1. **Prescriptive, not descriptive** — we tell users what to *do*; incumbents (Mint-likes, INDmoney, Jupiter, Walnut) mostly aggregate/track.
2. **Explainable AI + deterministic engine** — trustworthy, auditable advice (numbers never hallucinated), compliant-by-design.
3. **India-native depth** — EPF/PPF/NPS/ELSS/80C/tax-regime/family-money logic baked in, not bolted on.
4. **Conflict-free trust moat** — no data selling, no pushy product sales; trust compounds and is hard for ad/commission-driven incumbents to copy.
5. **Proprietary engagement layer** — Salary DNA, Health & Velocity scores, Command Center create a daily/payday habit and a data flywheel (more usage → better personalization → better outcomes → retention).
6. **Distribution optionality** — direct consumer + Enterprise (employer financial wellness) + (later) execution partnerships.

### 12.5 Business model
Freemium subscription: Free (hook) → Pro ₹299/mo → Premium ₹599/mo, annual-first with trials; Enterprise per-seat B2B2C; optional transparent affiliate. High-margin software once the deterministic engine + AA reduce per-user AI cost. Strong LTV via habitual payday usage; multiple expansion vectors (Premium upsell, Enterprise seats, ecosystem).

### 12.6 Why this can become a large company
- **Recurring, universal behavior:** everyone with a salary needs this every month — a built-in habit loop tied to payday.
- **Data + AI flywheel:** each paycheck and decision sharpens personalization, widening the moat and outcomes.
- **Trust as a durable moat:** a conflict-free advisory brand can become the default financial relationship for a generation — a wedge into being the financial OS for salaried India (advice today; orchestration of investing, insurance, lending tomorrow).
- **Multiple monetization layers:** consumer subscriptions + employer wellness + suitable-product ecosystem.
- **Massive, growing, under-served market** with structural tailwinds (AA, financialization, AI) arriving simultaneously — the rare "right product, right rails, right time" alignment.

> **The bet:** the company that becomes the trusted, AI-native financial coach for salaried India can become the front-end for how a generation manages, grows, and decides about money — a category-defining, multi-billion-dollar outcome.

---

### Appendix A — Glossary (India financial context)
EPF (Employees' Provident Fund), PPF (Public Provident Fund), NPS (National Pension System), SIP (Systematic Investment Plan), ELSS (Equity Linked Savings Scheme — tax-saving MF), 80C/80D (Income Tax deductions), HRA (House Rent Allowance), FD/RD (Fixed/Recurring Deposit), ESOP/RSU (employee equity), AA (Account Aggregator), DPDP (Digital Personal Data Protection Act), SEBI/RIA/RA (regulator / Registered Investment Adviser / Research Analyst), FIRE (Financial Independence, Retire Early), CTC (Cost To Company).

### Appendix B — Open questions / decisions to validate
1. **Regulatory posture:** advice-only (education) vs SEBI RIA registration — affects what the Coach can say and execution roadmap.
2. **Backend language:** TypeScript/NestJS vs Python/FastAPI — decide by team strength (AI-heavy → Python).
3. **AA timing:** launch manual-first, certify AA in parallel (Phase 3).
4. **LLM provider mix & cost ceilings** per active user.
5. **Free-tier limits** (messages, goals) — tune via experimentation for conversion vs. value.
