# UX Polish Report — Salary Coach AI

Goal: make every screen feel intentional, trustworthy, and premium (Apple Wallet / Monarch / Wealthfront tier). This pass tightened trust moments, states, terminology, haptics, and accessibility.

---

## 1. Trust moments

| Before | After |
|--------|-------|
| Payday screen always celebrated "🎉 Salary Received" with a success haptic, every visit | Celebration (and the confetti haptic) now fire **only on actual payday**; other days show a calm "Your salary plan · Payday in N days" with a light tap |
| Pull-to-refresh flashed a spinner with no real work | `onRefresh` now genuinely re-fetches the account from the backend (`profileStore.refresh()`, no-op fetch in mock mode), then recomputes scores + regenerates the blueprint |
| Goal detail showed ₹0 contribution but a confident completion date | Shows the **effective** contribution (flagged "suggested" when unset) + an assumptions footnote ("~11% p.a., results vary") |
| "Probability of success: 88%" with no methodology | Reframed as "Likelihood on track" with an explicit assumptions note |
| Soft paywall claimed a "7-day free trial" that didn't exist | Honest copy: "Renews monthly · cancel anytime · no data ever sold" |

---

## 2. States (loading / empty / error)

- **Coach errors** are now a proper bordered card with a **one-tap "Try again"** that re-sends the failed message (quota is never consumed on failure). Previously: a single easy-to-miss red line, no retry.
- **Coach attachments** no longer dump raw engine keys (`monthly_surplus`, `confidence`). Keys are humanized to Title Case, booleans render as Yes/No, and arrays (assumptions) render as a tidy bulleted list.
- **Home → Goals** now shows a tappable "Set your first goal" card when empty, instead of a header with nothing under it.

---

## 3. Terminology consistency
- Home hero now says "₹X/mo **surplus** to put to work" — aligned with the "surplus" language used in Profile and the Coach (previously "to allocate").
- "Blueprint" remains the consistent brand term for the salary allocation across home, payday, and the allocation card.

---

## 4. Motion & haptics
- Added a `selection` haptic (the crisp iOS "tick") to the haptics hook.
- The shared `Card` now fires a light haptic on every navigational tap (used pervasively across home, insights, plan), so the whole app feels tactile.
- Coach suggestion chips fire a selection haptic and carry accessibility labels.

---

## 5. Accessibility & touch targets
- Back chevron (`ScreenHeader`) enlarged from 38×38 to **44×44** (Apple HIG minimum).
- `SectionHeader` "See all"/action links got `hitSlop`, `accessibilityRole`, and labels.
- Coach retry, suggestion chips, and the empty-goal card all expose screen-reader labels.

---

## 6. Resilience
- `ErrorBoundary` fallback is now **theme-aware** (uses `colors.background`/themed text) instead of a hardcoded dark screen that jarred light-mode users.

---

## 7. Suggested follow-ups (not blocking)
- Animate score arcs/dials on first reveal (Reanimated is already in use on the payday screen).
- Replace the timed onboarding "building your blueprint" animation with one tied to real `generate()` completion.
- Consider gating or reframing the `velocity_score` entitlement, which is shown to free users today (kept as a teaser intentionally).
