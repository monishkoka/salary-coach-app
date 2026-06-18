/**
 * Centralized runtime configuration. Public values come from EXPO_PUBLIC_*
 * environment variables (safe to ship in the bundle). Secrets (OpenAI key)
 * never live here — they stay in the Supabase Edge Function.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const config = {
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    /** When false the app runs entirely on local mock data (great for demos/dev). */
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  },
  ai: {
    /** Edge Function route that proxies to the AI provider. */
    edgeFunction: 'ai-coach',
    blueprintFunction: 'salary-blueprint',
  },
  /** Turn on to bypass network and use mock data + deterministic engine only. */
  useMockData: !supabaseUrl,
  /** User-facing support & legal destinations (App Store requires these). */
  links: {
    privacyUrl: 'https://salarycoach.ai/privacy',
    termsUrl: 'https://salarycoach.ai/terms',
    supportEmail: 'support@salarycoach.ai',
  },
} as const;
