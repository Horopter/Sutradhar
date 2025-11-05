/**
 * Email Agent - Wraps email service as a Sutradhar agent
 */

import { IAgent, AgentTask, AgentResult, HealthStatus } from '../orchestrator/types';
import { emailService } from '../core/services/email-service';

class EmailAgent implements IAgent {
  id = 'email-agent';
  type = 'email';
  version = '1.0.0';

  constructor() {
    // Service is singleton, no need to inject
  }

  capabilities(): string[] {
    return ['send', 'resolveInboxId'];
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'send':
          const sendResult = await emailService.sendEmail(task.payload);
          return {
            success: sendResult.ok,
            data: sendResult.data,
            error: sendResult.error,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              mocked: sendResult.mocked,
            },
          };

        case 'resolveInboxId':
          const inboxId = await emailService.resolveInboxId(task.payload?.useCache);
          return {
            success: true,
            data: { inboxId },
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
        error: error.message || 'Email agent execution failed',
        metadata: {
          latency: Date.now() - startTime,
          agentId: this.id,
        },
      };
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      // Simple health check - try to resolve inbox ID
      const inboxId = await emailService.resolveInboxId(false);
      return {
        status: inboxId ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
      };
    }
  }
}

export { EmailAgent };

