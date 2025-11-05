/**
 * LLM Service - Business logic layer for LLM operations
 */

import { pluginRegistry } from '../plugin-registry';
import { ILLMPlugin, LLMRequest, LLMResponse } from '../interfaces/llm-plugin.interface';
import { log } from '../../log';
import { cache } from '../cache';

export class LLMService {
  private async getPlugin(): Promise<ILLMPlugin> {
    return await pluginRegistry.get<ILLMPlugin>('llm');
  }

  async chat(request: LLMRequest): Promise<{ ok: boolean; mocked?: boolean; data?: LLMResponse; error?: string }> {
    try {
      const plugin = await this.getPlugin();

      // Cache deterministic/system prompts with longer TTL
      // Skip caching for user queries as they're typically unique
      const isSystemPrompt = request.system && !request.user.includes('?');
      const cacheKey = `llm:${request.provider || 'default'}:${this.hashRequest(request)}`;
      
      if (isSystemPrompt) {
        const cached = await cache.get<LLMResponse>(cacheKey);
        if (cached) {
          log.info('LLM cache hit for system prompt', {
            provider: request.provider || plugin.getDefaultProvider(),
          });
          return {
            ok: true,
            mocked: false,
            data: cached,
          };
        }
      }

      const result = await plugin.chat(request);
      
      // Cache system prompts for 1 hour
      if (isSystemPrompt && result.ok && result.data) {
        await cache.set(cacheKey, result.data, 3600);
      }

      if (result.ok && result.data) {
        log.info('LLM response generated', {
          provider: request.provider || plugin.getDefaultProvider(),
          userLength: request.user.length,
          responseLength: result.data.text.length,
          mocked: result.mocked,
        });
      }

      return {
        ok: result.ok,
        mocked: result.mocked,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      log.error('LLM service error', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private hashRequest(request: LLMRequest): string {
    // Simple hash for caching (can be improved with crypto)
    const str = `${request.system}:${request.user}:${request.provider || ''}:${request.model || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const llmService = new LLMService();

