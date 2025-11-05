/**
 * Retrieval Agent - Wraps retrieval service as a Sutradhar agent
 */

import { IAgent, AgentTask, AgentResult, HealthStatus } from '../orchestrator/types';
import { retrievalService } from '../core/services/retrieval-service';

class RetrievalAgent implements IAgent {
  id = 'retrieval-agent';
  type = 'retrieval';
  version = '1.0.0';

  constructor() {
    // Service is singleton, no need to inject
  }

  capabilities(): string[] {
    return ['search', 'index', 'getStatus'];
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'search':
          const { query, maxResults } = task.payload;
          const searchResult = await retrievalService.search(query, maxResults);
          return {
            success: true,
            data: searchResult,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              mocked: searchResult.mocked,
            },
          };

        case 'index':
          const { documents } = task.payload;
          const indexResult = await retrievalService.indexDocuments(documents);
          return {
            success: true,
            data: indexResult,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
            },
          };

        case 'getStatus':
          const status = await retrievalService.getStatus();
          return {
            success: true,
            data: status,
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
        error: error.message || 'Retrieval agent execution failed',
        metadata: {
          latency: Date.now() - startTime,
          agentId: this.id,
        },
      };
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      const status = await retrievalService.getStatus();
      return {
        status: status.indexed ? 'healthy' : 'unhealthy',
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

export { RetrievalAgent };

