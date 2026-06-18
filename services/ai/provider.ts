/**
 * AI provider abstraction.
 *
 * The app NEVER calls OpenAI directly (the key must not ship in the bundle).
 * Instead it talks to a Supabase Edge Function which holds the secret and
 * proxies to the configured provider. This interface lets us swap providers
 * (OpenAI → Anthropic → on-device) without touching UI or store code.
 */

import type { AIContext, ChatMessage } from '@/types';

export interface ChatCompletionRequest {
  context: AIContext;
  messages: { role: 'user' | 'assistant'; content: string }[];
  conversationSummary?: string;
}

export interface ChatCompletionResponse {
  content: string;
  attachments?: ChatMessage['attachments'];
  toolName?: string | null;
}

export interface AIProvider {
  readonly id: string;
  chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
