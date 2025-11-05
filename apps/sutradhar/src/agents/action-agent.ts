/**
 * Action Agent - Wraps action service as a Sutradhar agent
 */

import { IAgent, AgentTask, AgentResult, HealthStatus } from '../orchestrator/types';
import { actionService } from '../core/services/action-service';

class ActionAgent implements IAgent {
  id = 'action-agent';
  type = 'action';
  version = '1.0.0';

  constructor() {
    // Service is singleton, no need to inject
  }

  capabilities(): string[] {
    return ['execute', 'listBySession'];
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'execute':
          const { actionType, payload } = task.payload;
          const result = await actionService.executeAction(actionType, payload);
          return {
            success: result.ok,
            data: result.data,
            error: result.error,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              mocked: result.mocked,
            },
          };

        case 'listBySession':
          const { sessionId } = task.payload;
          const actions = await actionService.getActionsBySession(sessionId);
          return {
            success: true,
            data: { actions },
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
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
        error: error.message || 'Action agent execution failed',
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

export { ActionAgent };

