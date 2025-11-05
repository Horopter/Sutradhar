/**
 * Mock LLM Plugin - Sophisticated mock that simulates realistic LLM responses
 */

import { BaseMockPlugin } from './base-mock-plugin';
import { ILLMPlugin, LLMRequest, LLMResponse } from '../interfaces/llm-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { log } from '../../log';

interface MockLLMCall {
  id: string;
  provider: string;
  model: string;
  system: string;
  user: string;
  response: string;
  timestamp: number;
}

export class LLMMockPlugin extends BaseMockPlugin implements ILLMPlugin {
  readonly metadata: PluginMetadata = {
    name: 'llm-mock',
    version: '1.0.0',
    description: 'Mock LLM provider with realistic response simulation',
    capabilities: ['openai', 'perplexity'],
  };

  readonly config: PluginConfig;
  private callStore: MockLLMCall[] = [];

  // Template responses based on system prompt patterns
  private responseTemplates: Map<string, (user: string) => string> = new Map([
    ['answer', (user: string) => `MOCK ANSWER: Based on the question "${user.slice(0, 100)}", here's a comprehensive response that addresses the key points...`],
    ['summarize', (user: string) => `MOCK SUMMARY: The content provided contains approximately ${Math.floor(user.length / 100)} key points. Summary: ${user.slice(0, 200)}...`],
    ['escalate', (user: string) => `MOCK ESCALATION ANALYSIS: After reviewing the issue "${user.slice(0, 100)}", this appears to be a [P1/P2/P3] priority escalation requiring human attention.`],
  ]);

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
    await this.simulateLatency(200, 800); // Simulate LLM latency

    const provider = request.provider || this.getDefaultProvider();
    const model = request.model || (provider === 'perplexity' ? 'pplx-7b-online' : 'gpt-4o-mini');

    // Generate context-aware mock response
    const responseText = this.generateMockResponse(request.system, request.user);
    
    const callId = this.generateId('llm');
    const citations = provider === 'perplexity' ? [
      'https://example.com/doc1',
      'https://example.com/doc2',
    ] : undefined;

    // Store call for audit
    this.callStore.push({
      id: callId,
      provider,
      model,
      system: request.system,
      user: request.user,
      response: responseText,
      timestamp: Date.now(),
    });

    // Keep last 1000 calls
    if (this.callStore.length > 1000) {
      this.callStore.shift();
    }

    log.info(`MOCK LLM: ${provider}/${model}`, {
      callId,
      userLength: request.user.length,
      systemLength: request.system.length,
    });

    return this.mockSuccess<LLMResponse>({
      text: responseText,
      citations,
      raw: {
        id: callId,
        provider,
        model,
        created: Date.now(),
      },
    }, {
      callId,
      provider,
      model,
      callCount: this.callStore.length,
    });
  }

  private generateMockResponse(system: string, user: string): string {
    // Detect system prompt type
    const systemLower = system.toLowerCase();
    
    if (systemLower.includes('answer') || systemLower.includes('assistant')) {
      const template = this.responseTemplates.get('answer');
      return template ? template(user) : `MOCK: ${user.slice(0, 400)}`;
    }
    
    if (systemLower.includes('summarize') || systemLower.includes('summary')) {
      const template = this.responseTemplates.get('summarize');
      return template ? template(user) : `MOCK SUMMARY: ${user.slice(0, 300)}`;
    }
    
    if (systemLower.includes('escalate') || systemLower.includes('escalation')) {
      const template = this.responseTemplates.get('escalate');
      return template ? template(user) : `MOCK ESCALATION: ${user.slice(0, 300)}`;
    }

    // Generic response
    return `MOCK: ${user.slice(0, 400)}`;
  }

  /**
   * Get mock LLM calls (for testing/debugging)
   */
  getMockCalls(filter?: { provider?: string }): MockLLMCall[] {
    let calls = [...this.callStore];
    
    if (filter?.provider) {
      calls = calls.filter(c => c.provider === filter.provider);
    }
    
    return calls;
  }

  /**
   * Clear mock call store
   */
  clearMockCalls(): void {
    this.callStore = [];
  }
}

