/**
 * Data Agent - Wraps Convex database operations as a Sutradhar agent
 */

import { IAgent, AgentTask, AgentResult, HealthStatus } from '../orchestrator/types';
import { Convex } from '../convexClient';

class DataAgent implements IAgent {
  id = 'data-agent';
  type = 'data';
  version = '1.0.0';

  constructor() {
    // Convex client is singleton
  }

  capabilities(): string[] {
    return ['query', 'mutation', 'batchQuery'];
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'query': {
          const { path, args } = task.payload;
          const result = await Convex.queries(path, args);
          
          return {
            success: true,
            data: result,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              operation: 'query',
              path,
            },
          };
        }

        case 'mutation': {
          const { path, args } = task.payload;
          const result = await Convex.mutations(path, args);
          
          return {
            success: true,
            data: result,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              operation: 'mutation',
              path,
            },
          };
        }

        case 'batchQuery': {
          const { queries } = task.payload;
          const { convexBatchQueries } = await import('../convexClient');
          const results = await convexBatchQueries(queries);
          
          return {
            success: true,
            data: results,
            metadata: {
              latency: Date.now() - startTime,
              agentId: this.id,
              version: this.version,
              operation: 'batchQuery',
              count: queries.length,
            },
          };
        }

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
        error: error.message || 'Data agent execution failed',
        metadata: {
          latency: Date.now() - startTime,
          agentId: this.id,
        },
      };
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      // Simple health check - try a lightweight query
      const testResult = await Convex.queries('sessions:list', {});
      return {
        status: testResult !== null ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
      };
    }
  }
}

export { DataAgent };

