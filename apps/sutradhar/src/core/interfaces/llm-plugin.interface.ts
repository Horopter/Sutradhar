/**
 * LLM Provider Plugin Interface
 */

import { IPlugin, PluginResult } from '../types';

export type LLMProvider = 'openai' | 'perplexity' | string;

export interface LLMRequest {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProvider;
}

export interface LLMResponse {
  text: string;
  citations?: string[];
  raw?: any;
}

export interface ILLMPlugin extends IPlugin {
  chat(request: LLMRequest): Promise<PluginResult<LLMResponse>>;
  listProviders(): LLMProvider[];
  getDefaultProvider(): LLMProvider;
}

