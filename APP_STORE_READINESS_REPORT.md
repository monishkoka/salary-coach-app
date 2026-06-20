# App Store Readiness Report — Salary Coach AI

Status of common App Store rejection / quality risks after this pass.

---

## 1. Crash & stability
| Item | Status |
|------|--------|
| App-wide crash guard (`ErrorBoundary`) | Present; now **theme-aware** so the recovery screen isn't a jarring dark flash for light-mode users |
| Render race on cold start | Bootstrap now serializes auth → profile load (no more "loaded but empty, no retry") |
| AI network hang | Edge function now wraps OpenAI calls with a **20s timeout** + `AbortController`, checks `res.ok`, and surfaces typed errors; client degrades gracefully to the offline engine |
| Malformed tool args | Edge function guards `JSON.parse` of tool arguments |

---

## 2. Privacy & data safety (App Store "Account Deletion" / data-handling expectations)
| Item | Status |
|------|--------|
| Sign-out fully clears account data | **Yes** — `clearAllUserState()` resets every store + clears persisted copies + wipes the sync queue |
| No cross-account leakage on a shared device | **Addressed** — teardown runs on both explicit and implicit sign-out; profile load validates `user.id` against the signed-in user |
| No demo/PII bleed into real accounts | **Fixed** — onboarding builds a clean profile from the user's own answers (no `priya@example.com` spread) |
| Privacy/Terms/Support links | Present in `constants/config` and surfaced in Profile |
| `PrivacyInfo.xcprivacy` | Present in the iOS project |

---

## 3. Monetization compliance
| Item | Status |
|------|--------|
| Honest subscription copy | **Fixed** — removed the false "7-day free trial" claim; paywall states "renews monthly, cancel anytime" |
| Entitlement abstraction ready for StoreKit | Yes — gating is by entitlement, not purchase mechanics |
| **Real IAP** | **Not yet** — `setTier` is still a local switch. Wire StoreKit 2 before submitting a paid build (see Production Readiness report) |

---

## 4. Navigation & flows
| Item | Status |
|------|--------|
| Payday CTAs | "Ask my coach first" now `push`es (returnable) rather than clearing the stack; primary CTA relabels to "Got it" off-payday |
| Auth redirects | Guarded in layouts (signed-out → login, not-onboarded → onboarding) |
| Back affordances | Back targets meet the 44pt minimum |

---

## 5. Accessibility
- Core interactive elements expose `accessibilityRole`/`accessibilityLabel`; touch targets raised toward 44pt; selection haptics added. A full VoiceOver sweep is recommended before submission.

---

## 6. Analytics & monitoring (release hygiene)
- Screen-view tracking across all tabs (`useScreenView`), `identify` on login/signup, and a complete coach funnel (`coach_message_sent` → `_succeeded`/`_failed`, `coach_quota_reached`) plus `subscribe_started`/`subscribe_completed`. Currently logs via the console client — point it at a real destination (PostHog/Amplitude) before launch.
- `app_error` is emitted from the crash boundary and the sync dead-letter path.

---

## 7. Pre-submission checklist (remaining)
- [ ] Wire real IAP (StoreKit 2) + server-side entitlement/quota verification.
- [ ] Point analytics at a production destination.
- [ ] Full VoiceOver / Dynamic Type pass.
- [ ] Confirm `EXPO_PUBLIC_SUPABASE_URL` is set in the production build (absent → app silently runs in mock/demo mode — add a build-time guard).
- [ ] App Privacy nutrition labels reflect collected financial data.

`tsc --noEmit` and `eslint` both pass clean.
