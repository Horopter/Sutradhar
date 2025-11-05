/**
 * Off-Topic Guardrail - Detects queries unrelated to the product/knowledge base
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';

export class OffTopicGuardrail implements IGuardrail {
  name = 'off_topic';
  category = 'off_topic' as const;
  description = 'Detects queries unrelated to the product or knowledge base';

  private readonly offTopicPatterns = [
    // Celebrities and public figures
    /\b(eminem|beyonce|taylor swift|justin bieber|celebrity|actor|singer|musician|rapper|artist|famous)\b/i,
    // Wikipedia-style questions
    /\b(wikipedia|encyclopedia|define|definition of|what does|meaning of)\b/i,
    // Weather, news, current events
    /\b(weather|news|current events|today|stock market|sports|politics|election)\b/i,
    // History, geography, science
    /\b(history of|who invented|where is|what country|capital of|science|physics|chemistry|biology)\b/i,
    // Movies, TV, entertainment
    /\b(movie|film|tv show|television|netflix|disney|marvel|star wars|game of thrones)\b/i,
    // General knowledge questions
    /\b(what is|who is|tell me about|explain)\b/i,
  ];

  private readonly productKeywords = [
    'plan', 'pricing', 'feature', 'support', 'account', 'subscription',
    'billing', 'export', 'video', 'upload', 'download', 'settings',
    'faq', 'help', 'issue', 'bug', 'error', 'troubleshoot', 'problem',
    'how to', 'how do i', 'can i', 'documentation', 'guide', 'tutorial',
    'api', 'integration', 'webhook', 'email', 'notification', 'alert',
  ];

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const query = context.query.toLowerCase().trim();

    // Get custom product keywords from config if provided
    const keywords = (config?.productKeywords as string[]) || this.productKeywords;

    // Check if query has product context
    const hasProductContext = keywords.some(kw => query.includes(kw.toLowerCase()));

    // If it has product context, allow it through
    if (hasProductContext) {
      return { allowed: true, category: 'off_topic' };
    }

    // Get custom off-topic patterns from config if provided
    const patterns = (config?.offTopicPatterns as RegExp[]) || this.offTopicPatterns;

    // Check for off-topic patterns
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return {
          allowed: false,
          reason: config?.offTopicMessage || 'I can only answer questions related to our product, support documentation, pricing, and policies. I don\'t have information about general topics, celebrities, or unrelated subjects.',
          category: 'off_topic',
          severity: 'medium',
        };
      }
    }

    // Check for question patterns that are likely off-topic
    const questionPattern = /^(what|who|where|when|why|how)\s+(is|are|was|were|does|do|did|can|could|should|will|would)\s+/i;
    if (questionPattern.test(query) && !hasProductContext) {
      const entityPattern = /\b(the|a|an)\s+([a-z]+(?:\s+[a-z]+){0,2})/i;
      const entityMatch = query.match(entityPattern);
      if (entityMatch) {
        const entity = entityMatch[2]?.toLowerCase();
        const productTerms = (config?.productTerms as string[]) || ['product', 'service', 'app', 'platform', 'system', 'tool', 'software', 'account', 'plan', 'subscription'];
        if (entity && !productTerms.some(term => entity.includes(term))) {
          return {
            allowed: false,
            reason: config?.offTopicMessage || 'I can only answer questions related to our product, support documentation, pricing, and policies. I don\'t have information about general topics, celebrities, or unrelated subjects.',
            category: 'off_topic',
            severity: 'medium',
          };
        }
      }
    }

    return { allowed: true, category: 'off_topic' };
  }
}

