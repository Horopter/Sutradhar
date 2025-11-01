/**
 * Core Architecture - Centralized Exports
 */

// Plugin Registry
export { pluginRegistry, PluginRegistry } from './plugin-registry';

// Plugin Factory
export { initializePlugins, shutdownPlugins } from './plugin-factory';

// Types
export type {
  IPlugin,
  PluginConfig,
  PluginMetadata,
  HealthStatus,
  PluginResult,
} from './types';

// Interfaces
export type { IEmailPlugin, SendEmailPayload, SendEmailResponse } from './interfaces/email-plugin.interface';
export type { IActionPlugin, ActionType, BaseActionPayload } from './interfaces/action-plugin.interface';
export type { ILLMPlugin, LLMRequest, LLMResponse, LLMProvider } from './interfaces/llm-plugin.interface';
export type { IRetrievalPlugin, SearchSnippet, IndexDocument } from './interfaces/retrieval-plugin.interface';
export type { IBrowserPlugin, BrowserActionPayload } from './interfaces/browser-plugin.interface';
export type { IDataPlugin, Session, Message, ActionLog } from './interfaces/data-plugin.interface';

// Services
export { emailService, EmailService } from './services/email-service';
export { actionService, ActionService } from './services/action-service';
export { llmService, LLMService } from './services/llm-service';
export { retrievalService, RetrievalService } from './services/retrieval-service';
export { answerService, AnswerService } from './services/answer-service';
export { sessionService, SessionService } from './services/session-service';

// Circuit Breaker
export { CircuitBreaker, circuitBreakerRegistry, CircuitState } from './circuit-breaker';

// Cache
export { cache, getCache, disconnectCache, MemoryCache, RedisCache, ICache } from './cache';

