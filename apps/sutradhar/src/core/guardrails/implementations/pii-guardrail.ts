/**
 * PII Guardrail - Detects personally identifiable information
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';

export class PIIGuardrail implements IGuardrail {
  name = 'pii';
  category = 'pii' as const;
  description = 'Detects personally identifiable information (PII)';

  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  };

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const query = context.query;
    const detected: string[] = [];

    // Check for email addresses
    if (config?.checkEmail !== false && this.patterns.email.test(query)) {
      detected.push('email address');
    }

    // Check for phone numbers
    if (config?.checkPhone !== false && this.patterns.phone.test(query)) {
      detected.push('phone number');
    }

    // Check for SSN
    if (config?.checkSSN !== false && this.patterns.ssn.test(query)) {
      detected.push('Social Security Number');
    }

    // Check for credit card numbers
    if (config?.checkCreditCard !== false && this.patterns.creditCard.test(query)) {
      detected.push('credit card number');
    }

    // Check for IP addresses (only if strict mode)
    if (config?.checkIP === true && this.patterns.ipAddress.test(query)) {
      detected.push('IP address');
    }

    if (detected.length > 0) {
      return {
        allowed: false,
        reason: config?.piiMessage || `For your security, please do not share ${detected.join(', ')} in your messages.`,
        category: 'pii',
        severity: 'high',
        metadata: { detectedTypes: detected },
      };
    }

    return { allowed: true, category: 'pii' };
  }
}

