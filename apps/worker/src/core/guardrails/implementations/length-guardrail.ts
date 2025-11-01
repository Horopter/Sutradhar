/**
 * Length Guardrail - Validates query length
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';

export class LengthGuardrail implements IGuardrail {
  name = 'length';
  category = 'length' as const;
  description = 'Validates query length is within acceptable limits';

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const query = context.query;
    const minLength = (config?.minLength as number) ?? 3;
    const maxLength = (config?.maxLength as number) ?? 2000;

    if (query.length < minLength) {
      return {
        allowed: false,
        reason: config?.tooShortMessage || `Please provide a question that is at least ${minLength} characters long.`,
        category: 'length',
        severity: 'low',
      };
    }

    if (query.length > maxLength) {
      return {
        allowed: false,
        reason: config?.tooLongMessage || `Please keep your question under ${maxLength} characters. You can break it into multiple questions if needed.`,
        category: 'length',
        severity: 'low',
      };
    }

    return { allowed: true, category: 'length' };
  }
}

