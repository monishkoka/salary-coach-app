# Financial Engine Report — Salary Coach AI

The engine is deterministic, paise-based, and explainable: the AI **narrates** engine output and never invents numbers. This report documents the engine's logic and the correctness improvements made in this pass.

---

## 1. Architecture (unchanged, validated)

| Module | Responsibility |
|--------|----------------|
| `services/engine/constants.ts` | **Single source of truth** for all policy knobs (high-interest threshold, savings/SIP targets, inflation, waterfall shares, risk mix) |
| `blueprint.ts` | Salary allocation waterfall: needs → expensive debt → emergency → investments → goals → guilt-free lifestyle |
| `scores.ts` | Financial Health (position) + Wealth Velocity (momentum), each from transparent, weighted sub-scores |
| `projection.ts` | Money GPS (4 routes) + Future Self (5 scenarios), monthly compounding with annual salary step-ups |
| `actionPlan.ts` | Biggest mistake / biggest opportunity + prioritized, quantified actions |
| `decision.ts` | "Should I buy X?" — 4-dimension analysis (cash flow, goals, emergency, opportunity cost) + confidence + Trust breakdown |
| `insights.ts`, `memory.ts` | Narrated insights + longitudinal snapshots |

Every recommendation carries a `Trust` object (reasoning / confidence / assumptions / risks).

---

## 2. Key correctness fix: essential vs. total expenses

**Problem.** Emergency-fund sizing and the Emergency Readiness health sub-score were computed against `totalExpensesPaise` (all spending). That overstates the buffer a user truly needs — in a job loss you cut discretionary spend first. The product already collects an `isEssential` flag per expense but the engine ignored it.

**Fix.** Added a single source of truth:

```ts
// services/engine/constants.ts
export function essentialMonthlyPaise(context: AIContext): number {
  const essential = context.expenses.filter(e => e.isEssential)
    .reduce((s, e) => s + e.amountPaise, 0);
  return essential > 0 ? essential : Math.max(0, context.financials.totalExpensesPaise);
}
```

It falls back to total expenses when no line items exist (aggregates-only profiles), so it is always safe. It is now used consistently for emergency-runway math in:

- `scores.ts` — Emergency Readiness sub-score
- `blueprint.ts` — emergency-fund top-up target
- `actionPlan.ts` — emergency gap + idle-cash detection
- `projection.ts` — months-to-fund the buffer on each route
- `decision.ts` — emergency-fund safety dimension
- `app/(tabs)/index.tsx` — the home Emergency Fund card now shows runway against essential spend

> Surplus (`income − totalExpenses`) and the FI corpus estimate (`25× total annual expenses`) intentionally still use **total** spend — those represent full lifestyle, which is correct.

---

## 3. Determinism & explainability guarantees

- All money is integer paise; no floats stored.
- All policy constants live in one file and are reused everywhere (blueprint, action plan, projection, scores) so the product's financial philosophy can't silently drift.
- The Money GPS "current route" and the blueprint share the same `RISK_MIX`, so the two features never disagree about how a user invests today.
- Confidence on projections is **data-completeness driven** (e.g. drops when there's no surplus or no investments), which is honest rather than falsely precise.

---

## 4. AI ↔ engine parity (server)

The `ai-coach` edge function previously used a *simplified* affordability tool and a thinner context/prompt than the client, so the LLM could narrate numbers that disagreed with the app. The edge function now:

- mirrors `evaluateDecision` (verdict, confidence, cash-flow strain, EMI share, emergency-fund impact, 5-year opportunity cost) and adds a `forecast_goal` tool (months/years to a named goal);
- ships the full `FINANCIAL_CONTEXT` (debts, goal amounts, scores) plus engine-computed `ADVISORY_SIGNALS`;
- uses the full `SYSTEM_PROMPT` + `POLICY_PROMPT` (compliance/scope guardrails) — identical philosophy to the client.

The in-app mock provider was also corrected to stop inventing a "65% of surplus" figure — the suggested SIP is now taken from the Money GPS recommended route (an explainable, engine-derived number).

---

## 5. UX honesty around numbers
- Goal detail now shows the **effective** monthly contribution used in the forecast (flagged "suggested" when the user hasn't set one) plus the modelling assumption ("~11% p.a., results vary"), eliminating the "₹0 contribution but a confident ETA" contradiction.
- "Probability of success" was reframed as "Likelihood on track" with an explicit assumptions footnote.
