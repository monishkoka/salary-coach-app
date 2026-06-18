# Salary Coach AI — Investor Readiness Report

> Prepared as if pitching seed/Series-A investors next month. Candid on strengths and gaps.
>
> **One line:** A personal CFO in your pocket for salaried India — it doesn't track your money, it tells you exactly what to do with your next paycheck, and explains why.

---

## 1. Snapshot

| | |
|---|---|
| **Stage** | Working MVP (Expo/React Native, iOS-first), deterministic financial engine + AI coach live in demo mode. |
| **Market** | Salaried professionals in India (beachhead: urban, English-comfortable, IT/BFSI/startups). |
| **Model** | Freemium subscription (Free / Pro ₹299/mo / Premium ₹599/mo) + Enterprise (employer wellness) + optional transparent affiliate. |
| **Investor readiness score** | **62/100 today → 92 achievable in ~2 quarters.** |
| **The ask (illustrative)** | Seed to prove retention + free→paid conversion and to ship the Account Aggregator data moat. |

---

## 2. Market size

- **TAM:** 100M+ salaried Indians; 400M+ workforce over time.
- **SAM (beachhead):** ~15–25M urban, smartphone-first, English-comfortable professionals with disposable income and an acute, unmet advisory need.
- **SOM (early):** 1–2M paying subscribers → at ~₹250/mo blended ARPU, **₹300–600 Cr ARR potential** before Enterprise and affiliate lines.
- **Why now (timing is the pitch):**
  - **Account Aggregator framework** makes consented, structured financial data programmatically available for the first time — the automation unlock.
  - **LLMs** make explainable, personalized advice economically viable at scale.
  - **Financialization of savings** (record-high mutual-fund SIPs) + UPI ubiquity + DPDP regulatory clarity arriving simultaneously: "right product, right rails, right time."

---

## 3. Why this can be a large company

1. **Recurring, universal behavior** — everyone with a salary needs this every month; a built-in habit loop tied to payday.
2. **Prescriptive, not descriptive** — incumbents (Mint-likes, INDmoney, Jupiter, Walnut) aggregate and track; this tells users what to *do* and why.
3. **Explainable AI + deterministic engine** — numbers are never hallucinated (the engine computes; the LLM narrates) → trustworthy, auditable, compliant-by-design, and cheap.
4. **Trust moat** — conflict-free, no data selling, no product pushing. Trust compounds and is hard for ad/commission-driven incumbents to copy.
5. **Data + AI flywheel** — each paycheck and decision sharpens personalization → better outcomes → retention → more data.
6. **Distribution optionality** — direct consumer + Enterprise (employer wellness) + (later) execution partnerships.

---

## 4. Product weaknesses (candid — what diligence will find)

| Weakness | Severity | Status |
|---|---|---|
| Data didn't persist across restarts (mock reloaded) | **Critical** | **Fixed** — durable local persistence shipped; server sync next. |
| No production data layer (Postgres schema exists, app never reads/writes it) | **Critical** | Open — repository layer is the #1 engineering priority. |
| Billing is a cosmetic local toggle (no StoreKit) | High | Open — revenue can't be collected yet. |
| Coach message quota was unenforced | High | **Fixed** — enforced per month with upgrade CTA. |
| AI coach wasn't fed the engine's own intelligence | High | **Fixed** — engine signals injected into grounding + offline coach upgraded. |
| No retention loop (streaks/reviews/celebrations) | High | **Seeded** — daily streak + Today's Focus shipped; reviews/notifications next. |
| Per-user data leaked across accounts on shared device | High (privacy) | **Fixed**. |
| No biometric lock, account deletion, or real analytics/crash telemetry | Med-High | Open — App Store + DPDP + measurement prerequisites. |
| No Account Aggregator integration yet (manual entry only) | Strategic | Open — the moat; planned Phase 3. |

**Honest framing for investors:** the *hard, defensible* parts (a real working financial engine, the explainable-AI doctrine, India-native domain modeling, a coherent premium design system) are built and good. The *known, well-scoped* parts (persistence/sync, billing, AA, telemetry) are execution, not invention.

---

## 5. Competitive threats

- **Incumbent aggregators (INDmoney, Jupiter, Cred, Walnut)** could bolt on AI advice. *Defense:* prescriptive engine + trust positioning + India-native depth are not a weekend feature; commission/ad models conflict with conflict-free advice.
- **Neobanks / brokers** adding "insights." *Defense:* their incentive is to sell products; our wedge is being the conflict-free advisor.
- **Horizontal LLM apps** ("ask ChatGPT about my money"). *Defense:* grounding in the user's real, structured data + deterministic numbers + AA sync is the difference between a chat toy and a CFO.
- **Regulatory** (SEBI advice boundary). *Defense:* education-first posture, compliant copy, deterministic-numbers-only — but the RIA-vs-education decision must be made deliberately (see open questions).
- **Platform risk** (Apple IAP take rate, policy). *Mitigation:* annual-first pricing, Enterprise B2B2C channel reduces IAP dependence.

---

## 6. Revenue opportunities

1. **Consumer subscriptions** — Free (hook) → Pro ₹299 → Premium ₹599, annual-first (~30% discount, 7-day trial). Trigger paywalls at "aha" moments (first blueprint, 2nd goal, 6th coach message, Velocity Score unlock).
2. **Enterprise (employer financial wellness)** — ₹50–₹150/employee/mo to HR; privacy-preserving aggregate dashboards. High LTV, strong distribution given India's organized-sector workforce.
3. **Affiliate (transparent, suitability-checked)** — term/health insurance, NPS onboarding — disclosed, never altering core advice.
4. **Premium depth** — FIRE/Monte Carlo, advanced tax, ESOP/RSU modeling for high-income personas.

**Unit economics intuition:** deterministic engine + model routing keep LLM/infra cost per active user low; AA reduces per-query reliance further. Path to healthy software gross margins.

---

## 7. Moat opportunities

- **Data moat (AA):** consented, continuously-synced financial data per user — compounding and hard to replicate.
- **Trust moat:** conflict-free brand becomes the default financial relationship for a generation.
- **Engagement moat:** Salary DNA, Health & Velocity scores, payday Command Center, streaks → daily/payday habit + decision ledger.
- **Compliance moat:** explainable, auditable, deterministic-numbers architecture is a regulatory asset, not just a feature.

---

## 8. Expansion opportunities

- **Execution layer:** deep-link → (later, partnered/RIA) invest/insure/transfer — become the front-end for money decisions.
- **Couples / household** view.
- **Android + web** to broaden TAM.
- **Regional languages**, tier-2/3 coverage.
- **Marketplace** of suitability-checked products; bank/employer distribution deals.
- **"Financial OS for salaried India"** — advice today; orchestration of investing, insurance, and lending tomorrow.

---

## 9. What we'd show investors next month

1. **Working demo** — onboarding → first Salary Blueprint → Health/Velocity scores → grounded AI coach → Future Self simulator. (Live today.)
2. **Retention instrumentation** — streaks + check-ins now tracked; wire a real analytics provider to show D1/D7/D30 and North Star (paycheck decisions executed). (In progress.)
3. **The moat plan** — AA integration timeline + the data flywheel narrative.
4. **A credible 2-quarter execution plan** — persistence/sync → billing → AA → enterprise pilot (see `WORLD_CLASS_UPGRADE_PLAN.md`).

---

## 10. Open questions to validate before the raise

1. **Regulatory posture:** education-only vs SEBI RIA registration — gates what the coach can say and the execution roadmap.
2. **Free-tier limits** (messages, goals) — tune for conversion vs. value via experimentation.
3. **AA timing** — launch manual-first, certify AA in parallel.
4. **LLM provider mix & cost ceilings** per active user.
5. **Enterprise GTM** — pilot design with 1–2 friendly employers.

---

*This report reflects the codebase after the first transformation wave (persistence, security hygiene, CFO-grade AI grounding, enforced monetization, and a seeded retention loop). See `WORLD_CLASS_UPGRADE_PLAN.md` for the full scorecard and ranked 100-item roadmap.*
