/**
 * OpenAI-backed provider. Calls the Supabase Edge Function `ai-coach`
 * (see supabase/functions/ai-coach) which holds the API key server-side and
 * runs the tool-calling loop against the deterministic engine.
 */

import { getSupabase } from '@/services/supabase/client';
import { config } from '@/constants/config';
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './provider';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const { data, error } = await getSupabase().functions.invoke<ChatCompletionResponse>(
      config.ai.edgeFunction,
      { body: req },
    );
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Empty response from AI service.');
    return data;
  }
}
