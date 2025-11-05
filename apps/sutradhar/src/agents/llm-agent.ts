/**
 * LLM Agent - Wraps LLM service as a Sutradhar agent
 */

import { IAgent, AgentTask, AgentResult, HealthStatus } from '../orchestrator/types';
import { llmService } from '../core/services/llm-service';

class LLMAgent implements IAgent {
  id = 'llm-agent';
  type = 'llm';
  version = '1.0.0';

  constructor() {
    // Service is singleton, no need to inject
  }

  capabilities(): string[] {
    return ['chat'];
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'chat':
          const chatResult = await llmService.chat(task.payload);
          return {
            success: chatResult.ok,
            data: chatResult.data,
            error: chatResult.error,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              mocked: chatResult.mocked,
            },
          };

        default:
          return {
            success: false,
            error: `Unknown task type: ${task.type}`,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
            },
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'LLM agent execution failed',
        metadata: {
          latency: Date.now() - startTime,
          agentId: this.id,
        },
      };
    }
  }

  async health(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      lastCheck: Date.now(),
    };
  }
}

export { LLMAgent };

