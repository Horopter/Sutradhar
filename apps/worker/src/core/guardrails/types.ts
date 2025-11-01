/**
 * Guardrails Types - Core interfaces for pluggable guardrail system
 */

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  category: GuardrailCategory;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export type GuardrailCategory =
  | 'safety'
  | 'relevance'
  | 'off_topic'
  | 'pii'
  | 'profanity'
  | 'spam'
  | 'length'
  | 'rate_limit'
  | 'language'
  | 'content_moderation'
  | 'privacy'
  | 'custom';

export interface GuardrailContext {
  query: string;
  snippets?: Array<{ text: string; score?: number; source?: string }>;
  sessionId?: string;
  userId?: string;
  persona?: string;
  metadata?: Record<string, any>;
}

export interface GuardrailConfig {
  enabled: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  [key: string]: any; // Allow custom config options per guardrail
}

export interface IGuardrail {
  /**
   * Unique identifier for this guardrail
   */
  name: string;

  /**
   * Category of this guardrail
   */
  category: GuardrailCategory;

  /**
   * Description of what this guardrail does
   */
  description: string;

  /**
   * Check if the query should be allowed
   */
  check(context: GuardrailContext, config?: GuardrailConfig): GuardrailResult | Promise<GuardrailResult>;
}

export interface PersonaGuardrailConfig {
  /**
   * Which guardrails are enabled for this persona
   */
  enabled: string[];

  /**
   * Custom configuration per guardrail
   */
  guardrails?: Record<string, GuardrailConfig>;
}

