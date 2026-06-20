import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/types';
import { aiChat } from '@/services/ai';
import { useProfileStore } from './profileStore';
import { useSubscriptionStore } from './subscriptionStore';
import { analytics } from '@/services/analytics';

interface CoachState {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  /** Calendar month (YYYY-MM) the quota counter applies to. */
  quotaMonth: string;
  /** Messages sent this calendar month (for free-tier rate limiting). */
  sentThisMonth: number;
  /** Set when the user hits their plan's monthly message limit. */
  limitReached: boolean;
  /** Last user message that failed to send, so the UI can offer a one-tap retry. */
  retryText: string | null;
  send: (text: string) => Promise<void>;
  /** Re-send the last message that failed. */
  retry: () => Promise<void>;
  remainingMessages: () => number;
  reset: () => void;
}

/** Monotonic counter so rapid messages never collide on Date.now() (React keys). */
let _seq = 0;
const nextId = (prefix: string): string => `${prefix}-${Date.now()}-${(_seq += 1)}`;

const monthKey = (): string => new Date().toISOString().slice(0, 7); // YYYY-MM

const WELCOME: ChatMessage = {
  id: 'welcome',
  conversationId: 'local',
  role: 'assistant',
  content:
    "Hi, I'm your Coach. I know your full financial picture, so ask me anything — like \u201cCan I afford a ₹12L car?\u201d or \u201cHow much should I invest?\u201d",
  createdAt: new Date().toISOString(),
};

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME],
      sending: false,
      error: null,
      quotaMonth: monthKey(),
      sentThisMonth: 0,
      limitReached: false,
      retryText: null,

      remainingMessages: () => {
        const limit = useSubscriptionStore.getState().entitlements.coachMessagesPerMonth;
        if (!Number.isFinite(limit)) return Infinity;
        const current = get().quotaMonth === monthKey() ? get().sentThisMonth : 0;
        return Math.max(0, limit - current);
      },

      send: async (text) => {
        const trimmed = text.trim();
        if (!trimmed || get().sending) return;

        const ctx = useProfileStore.getState().getContext();
        if (!ctx) {
          set({ error: 'Finish onboarding to start coaching.' });
          return;
        }

        // Roll the monthly quota window over at the start of a new month.
        const thisMonth = monthKey();
        const sent = get().quotaMonth === thisMonth ? get().sentThisMonth : 0;

        // Enforce the plan's monthly message limit (Infinity for paid tiers).
        const limit = useSubscriptionStore.getState().entitlements.coachMessagesPerMonth;
        if (Number.isFinite(limit) && sent >= limit) {
          set({
            quotaMonth: thisMonth,
            sentThisMonth: sent,
            limitReached: true,
            error: `You've used your ${limit} free coach messages this month. Upgrade to Pro for unlimited coaching.`,
          });
          analytics.track('coach_quota_reached', { limit });
          analytics.track('paywall_viewed', { source: 'coach_quota' });
          return;
        }

        const userMsg: ChatMessage = {
          id: nextId('u'),
          conversationId: 'local',
          role: 'user',
          content: trimmed,
          createdAt: new Date().toISOString(),
        };
        const typing: ChatMessage = {
          id: nextId('t'),
          conversationId: 'local',
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          pending: true,
        };

        set({
          messages: [...get().messages, userMsg, typing],
          sending: true,
          error: null,
          limitReached: false,
          retryText: null,
          quotaMonth: thisMonth,
          sentThisMonth: sent,
        });
        analytics.track('coach_message_sent');

        try {
          const history = get()
            .messages.filter((m) => !m.pending && m.id !== 'welcome')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

          const res = await aiChat({
            context: ctx,
            messages: [...history, { role: 'user', content: trimmed }],
          });

          const assistantMsg: ChatMessage = {
            id: nextId('a'),
            conversationId: 'local',
            role: 'assistant',
            content: res.content,
            attachments: res.attachments,
            toolName: res.toolName,
            createdAt: new Date().toISOString(),
          };
          set({
            messages: [...get().messages.filter((m) => !m.pending), assistantMsg],
            sending: false,
            sentThisMonth: get().sentThisMonth + 1,
          });
          analytics.track('coach_message_succeeded', { tool: res.toolName ?? null });
        } catch {
          // Drop the typing bubble AND the just-added user bubble, and stash the
          // text so the UI can offer a clean one-tap retry without a dangling
          // message. The quota is NOT consumed on failure.
          set({
            messages: get().messages.filter((m) => !m.pending && m.id !== userMsg.id),
            sending: false,
            error: 'The coach is unavailable right now.',
            retryText: trimmed,
          });
          analytics.track('coach_message_failed');
        }
      },

      retry: async () => {
        const text = get().retryText;
        if (!text) return;
        set({ retryText: null, error: null });
        await get().send(text);
      },

      reset: () =>
        set({
          messages: [WELCOME],
          error: null,
          sending: false,
          limitReached: false,
          retryText: null,
          // Zero the monthly quota counter too — it is persisted, so leaving it
          // set would carry one account's usage/paywall state into the next.
          quotaMonth: monthKey(),
          sentThisMonth: 0,
        }),
    }),
    {
      name: 'sc:coach',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        quotaMonth: state.quotaMonth,
        sentThisMonth: state.sentThisMonth,
      }),
    },
  ),
);
