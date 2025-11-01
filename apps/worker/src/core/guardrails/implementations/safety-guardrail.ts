/**
 * Safety Guardrail - Detects threats, self-harm, and harmful content
 * Production-optimized with compiled patterns and early returns
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';

export class SafetyGuardrail implements IGuardrail {
  name = 'safety';
  category = 'safety' as const;
  description = 'Detects threats, self-harm, and harmful content';

  // Pre-compiled patterns for performance (avoid recompilation)
  private readonly patterns = {
    selfHarm: [
      /\b(suicide|self.?harm|cut myself|end it all|want to die|kill myself)\b/i,
      /\b(no reason to live|better off dead|not worth living)\b/i,
      /\b(hurt myself|self.?injure|self.?destruct)\b/i,
    ],
    threats: [
      /\b(kill|murder|harm|attack|violence|bomb|terror|threat|dangerous)\b/i,
      /\b(hurt|injure|damage|destroy|assault|maim|torture)\b/i,
      /\b(shoot|stab|poison|explode|burn)\b/i,
    ],
    illegal: [
      /\b(hack|crack|pirate|illegal|fraud|steal|scam|drug|weapon)\b/i,
    ],
  };

  // Note: Pattern compilation is done at class initialization for performance
  // All patterns are pre-compiled regex objects that can be reused

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const query = context.query;
    
    // Early return if query is very short (unlikely to contain threats)
    if (query.length < 3) {
      return { allowed: true, category: 'safety' };
    }

    const queryLower = query.toLowerCase();

    // Check for self-harm indicators (highest priority)
    for (const pattern of this.patterns.selfHarm) {
      if (pattern.test(queryLower)) {
        return {
          allowed: false,
          reason: config?.selfHarmMessage || 'I\'m not equipped to help with self-harm concerns. Please reach out to a mental health professional or crisis helpline for immediate support.',
          category: 'safety',
          severity: 'critical',
        };
      }
    }

    // Check for threats
    for (const pattern of this.patterns.threats) {
      if (pattern.test(queryLower)) {
        return {
          allowed: false,
          reason: config?.threatMessage || 'I cannot assist with queries related to threats or violence. If you have concerns, please contact appropriate authorities.',
          category: 'safety',
          severity: 'critical',
        };
      }
    }

    // Check for illegal activities (only if enabled)
    if (config?.checkIllegal !== false) {
      for (const pattern of this.patterns.illegal) {
        if (pattern.test(queryLower)) {
          return {
            allowed: false,
            reason: config?.illegalMessage || 'I cannot assist with queries related to illegal activities.',
            category: 'safety',
            severity: 'high',
          };
        }
      }
    }

    return { allowed: true, category: 'safety' };
  }
}

