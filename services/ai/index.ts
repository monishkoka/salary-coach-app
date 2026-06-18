/**
 * AI service entry point. Selects a provider based on configuration and
 * exposes a single `aiChat()` function the rest of the app uses. Swapping
 * providers (OpenAI ↔ Anthropic ↔ on-device) happens only here.
 */

import { config } from '@/constants/config';
import { OpenAIProvider } from './openaiProvider';
import { MockProvider } from './mockProvider';
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './provider';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;
  _provider = config.useMockData ? new MockProvider() : new OpenAIProvider();
  return _provider;
}

export async function aiChat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  try {
    return await getAIProvider().chat(req);
  } catch (err) {
    // Graceful degradation: fall back to the local engine-backed mock so the
    // coach is never fully unavailable.
    if (!(getAIProvider() instanceof MockProvider)) {
      return new MockProvider().chat(req);
    }
    throw err;
  }
}

export * from './provider';
export * from './prompts';
