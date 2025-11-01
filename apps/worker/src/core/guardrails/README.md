# Guardrails System

A pluggable, persona-aware guardrail system for validating and filtering user queries.

## Overview

The guardrails system provides multiple layers of protection:
- **Safety**: Detects threats, self-harm, and harmful content
- **Relevance**: Validates that retrieved snippets match queries
- **Off-topic**: Blocks queries unrelated to the knowledge base
- **PII**: Detects personally identifiable information
- **Profanity**: Filters inappropriate language
- **Spam**: Detects repetitive or spam-like queries
- **Length**: Validates query length limits

## Architecture

### Core Components

1. **IGuardrail Interface**: Contract for all guardrail implementations
2. **GuardrailRegistry**: Central registry that manages guardrails and persona configurations
3. **Guardrail Implementations**: Individual guardrail classes
4. **Persona Configurations**: Pre-configured sets of guardrails for different use cases

### Usage

#### Basic Usage

```typescript
import { checkGuardrails } from './core/guardrails';

// Simple check (uses default persona)
const result = await checkGuardrails(query);

// With snippets and persona
const result = await checkGuardrails(query, snippets, 'moderator');
```

#### Advanced Usage

```typescript
import { guardrailRegistry } from './core/guardrails';

const context = {
  query: userQuery,
  snippets: retrievedSnippets,
  sessionId: session.id,
  persona: 'moderator',
};

const result = await guardrailRegistry.check(context, 'moderator');
```

## Personas

### Default
Standard community manager/support persona with all guardrails enabled.

### Greeter
Friendly, welcoming persona - more permissive:
- Allows short greetings
- No spam checks
- Lower relevance thresholds

### Moderator
Strict content moderation:
- All guardrails enabled
- Higher relevance thresholds
- Strict spam detection
- PII checking including IPs

### Escalator
Handles escalations - permissive for user expression:
- Off-topic disabled (allows broader questions)
- Profanity disabled (allows frustration)
- Higher spam tolerance
- Longer length limits for detailed context

### Strict
Maximum security:
- All guardrails at highest settings
- Very high relevance thresholds
- Strict spam and length limits

### Lenient
Minimum restrictions:
- Only safety, off-topic, and relevance checks
- Lower thresholds
- Other guardrails disabled

### Technical
For technical support:
- Off-topic disabled (allows technical questions)
- Standard safety and relevance checks

## Creating Custom Guardrails

```typescript
import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from './types';

export class CustomGuardrail implements IGuardrail {
  name = 'custom';
  category = 'custom' as const;
  description = 'My custom guardrail';

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    // Your validation logic here
    if (/* condition */) {
      return {
        allowed: false,
        reason: 'Custom rejection message',
        category: 'custom',
        severity: 'medium',
      };
    }

    return { allowed: true, category: 'custom' };
  }
}

// Register it
import { guardrailRegistry } from './registry';
guardrailRegistry.register(new CustomGuardrail());
```

## Configuring Personas

```typescript
import { guardrailRegistry } from './registry';

guardrailRegistry.configurePersona('my_persona', {
  enabled: ['safety', 'relevance', 'custom'],
  guardrails: {
    safety: { enabled: true },
    relevance: { 
      enabled: true, 
      minScore: 0.35,
      minRelevanceRatio: 0.35,
    },
    custom: {
      enabled: true,
      customOption: 'value',
    },
  },
});
```

## Guardrail Categories

- `safety`: Threats, self-harm, illegal activities
- `relevance`: Validates snippet relevance
- `off_topic`: Blocks unrelated queries
- `pii`: Personally identifiable information
- `profanity`: Inappropriate language
- `spam`: Repetitive or spam-like queries
- `length`: Query length validation
- `custom`: Custom guardrails

## Severity Levels

- `critical`: Safety issues, must always block
- `high`: Serious violations, typically block
- `medium`: Moderate violations, configurable
- `low`: Minor violations, often warn-only

