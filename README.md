# Salary Coach AI

> Your personal CFO for salaried India. Most apps track spending — this one tells you exactly what to do with your **next** salary.

A production-grade MVP built with **Expo (React Native) + TypeScript + Supabase**. It generates a personalized, explained salary blueprint, scores your financial health and wealth velocity, and answers money questions through an AI coach grounded in your real data.

For the full product/strategy/AI/architecture document, see [`PRODUCT_BLUEPRINT.md`](./PRODUCT_BLUEPRINT.md).

---

## Highlights

- **AI Salary Blueprint** — every paycheck split into Needs / Emergency / Debt / Investments / Goals / Lifestyle, with a one-tap "why" for each line.
- **Financial Health Score & Wealth Velocity Score** — proprietary 0–100 scores with transparent sub-factor breakdowns.
- **AI Coach** — conversational, grounded in your numbers ("Can I afford a ₹12L car?"). Works fully offline via a local engine-backed mock, or via OpenAI through a Supabase Edge Function.
- **10-step onboarding** that produces a real blueprint in ~2 minutes.
- **Light/Dark themes**, premium calm UI inspired by Apple Health / Wealthfront / Monarch.
- **Deterministic financial engine** — the AI never invents numbers; all figures come from `services/engine`.

## Runs out of the box (mock mode)

If you don't configure Supabase, the app runs entirely on realistic mock data + the local deterministic engine. Sign up/in with any credentials. This is ideal for design review and demos.

```bash
npm install
npm run start      # then press "i" for iOS simulator, or scan the QR with Expo Go
```

> Requires Node 18+, the Expo toolchain, and Xcode (for the iOS simulator).

## Connect the backend (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the schema in `supabase/migrations/0001_init.sql` (SQL Editor or `supabase db push`).
3. Copy `.env.example` → `.env` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. (AI Coach with OpenAI) Deploy the edge function and set the secret:
   ```bash
   supabase functions deploy ai-coach
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

The app auto-detects configuration: with env vars set it uses Supabase Auth + the Edge Function; without them it stays in mock mode.

---

## Project structure

```
app/                       # Expo Router routes
  _layout.tsx              # providers + bootstrap + splash
  index.tsx                # auth/onboarding/tabs redirect logic
  (auth)/                  # login, signup, forgot-password (+ guard)
  (onboarding)/            # 10-step flow → first blueprint
  (tabs)/                  # Home, Plan(goals), Coach, Insights, Profile
components/
  buttons/ cards/ charts/ forms/ layout/ coach/ goals/ onboarding/
services/
  engine/                  # deterministic blueprint, scores, affordability
  ai/                      # provider abstraction + OpenAI + local mock + prompts
  supabase/                # client + auth
  analytics/               # event tracking abstraction
store/                     # Zustand: auth, profile, blueprint, coach, theme, onboarding
types/                     # domain models (money as integer paise)
hooks/  utils/  constants/
supabase/
  migrations/0001_init.sql # full schema (tables, indexes, RLS, triggers)
  functions/ai-coach/      # Deno edge function (holds the OpenAI key)
```

### Architecture decisions

- **SwiftUI-grade native feel via Expo + NativeWind** — fast iteration, single codebase, premium UI.
- **Deterministic engine + LLM layer** — the engine computes all money math; the LLM only explains/converses and calls engine "tools". This keeps advice accurate, auditable, compliant, and cheap.
- **Provider abstraction** (`services/ai/provider.ts`) — swap OpenAI ↔ Anthropic ↔ on-device without touching UI.
- **Money as integer paise** everywhere; Indian (lakh/crore) formatting in `utils/currency.ts`.
- **Secrets never ship in the bundle** — the OpenAI key lives only in the Supabase Edge Function.
- **Row Level Security** on every table; sessions persisted in encrypted SecureStore.

### Scripts

```bash
npm run start       # Expo dev server
npm run ios         # build & run iOS
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier
```

---

## MVP implementation roadmap

**Done in this MVP (Phase 1):** onboarding → blueprint, Health + Velocity scores, deterministic engine, AI coach (mock + OpenAI edge function), goals CRUD + forecasting, insights feed + score breakdown, light/dark, full Supabase schema with RLS, auth flow + route guards.

**Next up to make it real:**

| # | Task | Notes |
|---|------|-------|
| 1 | Wire repositories | Replace mock loads in `profileStore.load()` with Supabase reads/writes per table. |
| 2 | Persist blueprints, scores, recommendations | Snapshot each cycle to `salary_blueprints` / `financial_scores` for trends. |
| 3 | Real AI tool-loop | Expand `supabase/functions/ai-coach` with `forecast_goal`, `simulate_scenario`, memory (pgvector). |
| 4 | Push notifications | Payday + bill + goal-milestone nudges via APNs/Expo Notifications. |
| 5 | Paywall + IAP | StoreKit via `expo-in-app-purchases`; gate Pro/Premium features. |
| 6 | Account Aggregator | Auto-import income/expenses/investments via an AA TSP (Setu/Finvu). |
| 7 | Future Self Simulator + Life Events | Interactive scenarios in the Plan tab. |
| 8 | Hardening | Error boundaries, offline cache (SwiftData/MMKV), analytics (PostHog), tests, accessibility audit. |

---

_Educational financial guidance, not SEBI-registered investment advice._
