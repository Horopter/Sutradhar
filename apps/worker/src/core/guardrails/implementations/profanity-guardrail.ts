/**
 * Profanity Guardrail - Detects profanity and vulgar language
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';

export class ProfanityGuardrail implements IGuardrail {
  name = 'profanity';
  category = 'profanity' as const;
  description = 'Detects profanity and vulgar language';

  // Common profanity patterns (simplified - in production, use a more comprehensive list)
  private readonly patterns = [
    /\b(fuck|shit|damn|bitch|asshole|piss|cunt|bastard)\b/i,
    /\b(hell|damn|dammit)\b/i,
  ];

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    // Allow disabling profanity check
    if (config?.enabled === false) {
      return { allowed: true, category: 'profanity' };
    }

    const query = context.query;
    const customPatterns = (config?.patterns as RegExp[]) || this.patterns;

    for (const pattern of customPatterns) {
      if (pattern.test(query)) {
        return {
          allowed: false,
          reason: config?.profanityMessage || 'Please keep your language appropriate. I\'m here to help with product-related questions.',
          category: 'profanity',
          severity: 'low',
        };
      }
    }

    return { allowed: true, category: 'profanity' };
  }
}

