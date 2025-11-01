/**
 * Real LLM Plugin - Wraps existing LLM router
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import { ILLMPlugin, LLMRequest, LLMResponse } from '../interfaces/llm-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { llmAnswer } from '../../llm/router';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class LLMRealPlugin extends BaseMockPlugin implements ILLMPlugin {
  readonly metadata: PluginMetadata = {
    name: 'llm-real',
    version: '1.0.0',
    description: 'Real LLM provider (OpenAI/Perplexity)',
    capabilities: ['openai', 'perplexity'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('llm-provider', {
    failureThreshold: 3,
    resetTimeout: 60000,
  });

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  listProviders(): string[] {
    return ['openai', 'perplexity'];
  }

  getDefaultProvider(): string {
    return this.config.defaultProvider || 'openai';
  }

  async chat(request: LLMRequest): Promise<PluginResult<LLMResponse>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await llmAnswer({
          system: request.system,
          user: request.user,
          provider: request.provider as any,
          model: request.model,
        });
      });

      const response = result as any;

      return {
        ok: true,
        mocked: false,
        data: {
          text: response.text || '',
          citations: response.citations,
          raw: response.raw,
        },
      };
    } catch (error) {
      log.error('LLM chat failed', error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

