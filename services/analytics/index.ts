/**
 * Analytics abstraction. Today it logs to console in dev and is a no-op in
 * production; wire it to PostHog/Amplitude later without touching call sites.
 *
 * The North Star event is `recommendation_executed` (paycheck decisions acted on).
 */

type EventName =
  | 'app_open'
  | 'signup'
  | 'login'
  | 'logout'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'blueprint_generated'
  | 'recommendation_executed'
  // Coach funnel: attempt → success | failure, plus quota.
  | 'coach_message_sent'
  | 'coach_message_succeeded'
  | 'coach_message_failed'
  | 'coach_quota_reached'
  | 'goal_created'
  | 'goal_updated'
  // Monetization funnel.
  | 'paywall_viewed'
  | 'subscribe_started'
  | 'subscribe_completed'
  // Upgrade: forward-looking engagement surfaces.
  | 'money_gps_viewed'
  | 'future_self_simulated'
  | 'scenario_compared'
  | 'payday_celebrated'
  | 'action_plan_item_done'
  | 'health_breakdown_viewed'
  | 'feature_locked_hit'
  | 'daily_checkin'
  | 'streak_extended'
  | 'app_error';

interface AnalyticsClient {
  track(event: EventName, props?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  screen(name: string): void;
}

const consoleClient: AnalyticsClient = {
  track: (event, props) => {
    if (__DEV__) console.log(`[analytics] ${event}`, props ?? {});
  },
  identify: (userId, traits) => {
    if (__DEV__) console.log(`[analytics] identify ${userId}`, traits ?? {});
  },
  screen: (name) => {
    if (__DEV__) console.log(`[analytics] screen ${name}`);
  },
};

export const analytics: AnalyticsClient = consoleClient;
