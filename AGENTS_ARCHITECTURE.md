# Agent-Based Architecture for Apex Academy

## Overview

Apex Academy now uses a **lean agent architecture** where each agent has a single, well-defined responsibility. This design ensures:

1. **Single Responsibility Principle** - Each agent does one thing well
2. **Composability** - Agents can be combined for complex workflows
3. **Maintainability** - Changes to unified services don't break agent implementations
4. **Testability** - Easy to unit test individual agents
5. **Consistency** - Uniform error handling and result patterns

## Agent Registry

All agents are registered in `apps/worker/src/agents/index.ts`:

```typescript
import { agentRegistry } from './agents';

// Get an agent
const authAgent = agentRegistry.get('AuthAgent');

// Use the agent
const result = await authAgent.createGuest();
```

## Agents & Their Responsibilities

### 1. **AuthAgent** - Authentication
- Creates guest sessions
- Sends magic link emails
- Verifies magic link tokens

### 2. **CourseAgent** - Course Management
- Lists courses from `data_repository/`
- Lists lessons for a course
- Retrieves individual lessons

### 3. **TutoringAgent** - AI Tutoring
- Answers questions (delegates to ConversationService)
- Provides hints (never full solutions)
- Escalates to human support

### 4. **QuizAgent** - Quiz Management
- Retrieves quizzes
- Submits quiz attempts
- Calculates scores and passes/fails

### 5. **CodeAgent** - Coding Assignments
- Retrieves coding assignments
- Runs code with sandboxing
- Saves code submissions

### 6. **ProgressAgent** - Progress Tracking
- Gets user progress summaries
- Updates streaks
- Awards badges
- Logs events

### 7. **ImageAgent** - Image Management
- Fetches course images (Moss bridge + local fallback)
- Caches images for all courses

### 8. **StudyPlanAgent** - Study Planning
- Creates spaced repetition plans
- Generates calendar events via Composio
- Retrieves user schedules

### 9. **NotificationAgent** - Notifications
- Posts to forums (BrowserUse)
- Sends Slack messages

## Route Integration

Routes now delegate to agents instead of directly calling services:

**Before (direct service calls):**
```typescript
router.post('/auth/guest', async (req, res) => {
  const result = await Convex.mutations('users:createGuest', {});
  // ... handle result
});
```

**After (agent-based):**
```typescript
router.post('/auth/guest', async (req, res) => {
  const agent = agentRegistry.get('AuthAgent');
  const result = await agent.createGuest();
  
  res.json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
});
```

## Benefits Over Direct Service Calls

1. **Abstraction Layer** - Routes don't need to know about Convex, services, etc.
2. **Consistent Interface** - All agents return `AgentResult<T>`
3. **Easy Testing** - Mock agents instead of entire service layers
4. **Future-Proof** - Can swap implementations without changing routes
5. **Composability** - Agents can call other agents

## Agent Result Pattern

All agents return a consistent result type:

```typescript
interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
```

## Service Integration

Agents use the unified service layer when needed:

- **TutoringAgent** → `ConversationService` (for Q&A)
- **ImageAgent** → `KnowledgeService` (for image search)
- **StudyPlanAgent** → `UnifiedActionService` (for calendar events)
- **NotificationAgent** → `CommunicationService` (for Slack/email)

This maintains the abstraction: agents don't need to know about Hyperspell, Composio, AgentMail, etc.

## Future Enhancements

1. **Agent Metrics** - Track agent performance
2. **Agent Caching** - Cache agent results
3. **Agent Composition** - Higher-level agents that orchestrate others
4. **Agent Retry Logic** - Automatic retries for failed operations
5. **Agent Circuit Breakers** - Prevent cascading failures

## Migration Path

The new agent-based routes are in `edtech-v2.ts`. To migrate:

1. All existing routes in `edtech.ts` continue to work (backward compatible)
2. New routes use agents via `edtech-v2.ts`
3. Eventually, `edtech.ts` can be deprecated

## Example: Adding a New Agent

```typescript
// agents/new-agent.ts
import { BaseAgent, AgentResult } from './base-agent';

export class NewAgent extends BaseAgent {
  constructor() {
    super('NewAgent', 'Does one specific thing');
  }

  async doSomething(input: string): Promise<AgentResult<{ output: string }>> {
    try {
      // Do work
      return this.success({ output: 'result' });
    } catch (error: any) {
      return this.error(error.message);
    }
  }
}

// agents/index.ts
import { NewAgent } from './new-agent';

export class AgentRegistry {
  constructor() {
    // ...
    this.register(new NewAgent());
  }
}
```

## Testing Agents

```typescript
import { AuthAgent } from './agents';

describe('AuthAgent', () => {
  it('should create guest user', async () => {
    const agent = new AuthAgent();
    const result = await agent.createGuest();
    
    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.sessionId).toBeDefined();
  });
});
```

---

This architecture ensures Apex Academy remains maintainable and extensible as the unified service layer evolves.

