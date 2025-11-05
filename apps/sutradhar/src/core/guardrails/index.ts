/**
 * Guardrails - Main entry point for pluggable guardrail system
 */

import { log } from '../../log';
import { guardrailRegistry } from './registry';
import {
  SafetyGuardrail,
  OffTopicGuardrail,
  RelevanceGuardrail,
  PIIGuardrail,
  ProfanityGuardrail,
  SpamGuardrail,
  LengthGuardrail,
} from './implementations';
import { GuardrailContext, GuardrailResult } from './types';

// Register all default guardrails
const safety = new SafetyGuardrail();
const offTopic = new OffTopicGuardrail();
const relevance = new RelevanceGuardrail();
const pii = new PIIGuardrail();
const profanity = new ProfanityGuardrail();
const spam = new SpamGuardrail();
const length = new LengthGuardrail();

guardrailRegistry.register(safety);
guardrailRegistry.register(offTopic);
guardrailRegistry.register(relevance);
guardrailRegistry.register(pii);
guardrailRegistry.register(profanity);
guardrailRegistry.register(spam);
guardrailRegistry.register(length);

// Configure default persona (community manager/support)
guardrailRegistry.configurePersona('default', {
  enabled: ['safety', 'off_topic', 'relevance', 'pii', 'profanity', 'spam', 'length'],
  guardrails: {
    profanity: { enabled: true },
    spam: { enabled: true, maxRepeats: 3 },
    length: { enabled: true, minLength: 3, maxLength: 2000 },
    pii: { enabled: true, checkIP: false },
  },
});

// Configure Greeter persona (friendly, welcoming, more permissive)
guardrailRegistry.configurePersona('greeter', {
  enabled: ['safety', 'off_topic', 'relevance', 'profanity', 'length'],
  guardrails: {
    profanity: { enabled: true },
    spam: { enabled: false }, // More lenient on repeats for greetings
    length: { enabled: true, minLength: 1, maxLength: 2000 }, // Allow short greetings
    pii: { enabled: false }, // Allow sharing info in greetings
    relevance: { enabled: true, minScore: 0.2 },
  },
});

// Configure Moderator persona (strict content moderation)
guardrailRegistry.configurePersona('moderator', {
  enabled: ['safety', 'off_topic', 'relevance', 'pii', 'profanity', 'spam', 'length'],
  guardrails: {
    profanity: { enabled: true },
    spam: { enabled: true, maxRepeats: 2, timeWindowMs: 30000 },
    length: { enabled: true, minLength: 5, maxLength: 1000 },
    pii: { enabled: true, checkIP: true },
    relevance: { enabled: true, minScore: 0.4, minRelevanceRatio: 0.4 },
  },
});

// Configure Escalator persona (handles escalations, strict on safety)
guardrailRegistry.configurePersona('escalator', {
  enabled: ['safety', 'relevance', 'pii', 'spam', 'length'],
  guardrails: {
    off_topic: { enabled: false }, // Allow broader questions for escalations
    profanity: { enabled: false }, // Allow users to express frustration
    spam: { enabled: true, maxRepeats: 5 }, // Allow repeated escalation attempts
    length: { enabled: true, minLength: 3, maxLength: 5000 }, // Allow detailed escalation context
    relevance: { enabled: true, minScore: 0.25 },
  },
});

// Configure strict persona (high security/strict content filtering)
guardrailRegistry.configurePersona('strict', {
  enabled: ['safety', 'off_topic', 'relevance', 'pii', 'profanity', 'spam', 'length'],
  guardrails: {
    profanity: { enabled: true },
    spam: { enabled: true, maxRepeats: 2, timeWindowMs: 30000 },
    length: { enabled: true, minLength: 5, maxLength: 1000 },
    pii: { enabled: true, checkIP: true },
    relevance: { enabled: true, minScore: 0.4, minRelevanceRatio: 0.4 },
  },
});

// Configure lenient persona (more permissive, fewer restrictions)
guardrailRegistry.configurePersona('lenient', {
  enabled: ['safety', 'off_topic', 'relevance'],
  guardrails: {
    profanity: { enabled: false },
    spam: { enabled: false },
    length: { enabled: false },
    pii: { enabled: false },
    relevance: { enabled: true, minScore: 0.2, minRelevanceRatio: 0.2 },
  },
});

// Configure technical support persona (allows technical questions, strict on safety)
guardrailRegistry.configurePersona('technical', {
  enabled: ['safety', 'relevance', 'pii', 'spam', 'length'],
  guardrails: {
    off_topic: { enabled: false }, // Allow broader technical questions
    relevance: { enabled: true, minScore: 0.25 },
  },
});

/**
 * Main function to check guardrails
 * Production-ready with error handling
 */
export async function checkGuardrails(
  query: string,
  snippets?: Array<{ text: string; score?: number; source?: string }>,
  persona?: string
): Promise<GuardrailResult> {
  // Validate inputs
  if (!query || typeof query !== 'string') {
    return {
      allowed: false,
      reason: 'Invalid query provided',
      category: 'custom',
      severity: 'medium',
    };
  }

  const context: GuardrailContext = {
    query: query.trim(),
    snippets,
    persona,
  };

  try {
    return await guardrailRegistry.check(context, persona || 'default');
  } catch (error) {
    // Fallback on unexpected errors
    log.error('Unexpected error in checkGuardrails', error);
    return {
      allowed: true, // Graceful degradation
      category: 'custom',
      metadata: { error: 'Guardrail system error, query allowed' },
    };
  }
}

// Export types and registry for advanced usage
export { guardrailRegistry } from './registry';
export * from './types';
export * from './implementations';

