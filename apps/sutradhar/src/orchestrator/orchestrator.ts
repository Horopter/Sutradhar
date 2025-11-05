/**
 * Sutradhar Orchestrator - Main orchestration engine
 */

import { agentRegistry } from './registry';
import { AgentDefinition, AgentTask, AgentResult, AgentHandle } from './types';
import { InProcessRuntime } from './runtime/in-process';
import { HttpRuntime } from './runtime/http';

export class Orchestrator {
  private inProcessRuntime: InProcessRuntime;
  private httpRuntime: HttpRuntime;

  constructor() {
    this.inProcessRuntime = new InProcessRuntime();
    this.httpRuntime = new HttpRuntime();
  }

  /**
   * Register a new agent
   */
  async registerAgent(definition: AgentDefinition): Promise<AgentHandle> {
    return await agentRegistry.register(definition);
  }

  /**
   * Execute a task via an agent
   */
  async executeTask(agentId: string, task: AgentTask): Promise<AgentResult> {
    const handle = agentRegistry.get(agentId);
    if (!handle) {
      return {
        success: false,
        error: `Agent not found: ${agentId}`,
      };
    }

    // Route to appropriate runtime
    switch (handle.runtime) {
      case 'in-process':
        return await this.inProcessRuntime.execute(handle, task);
      case 'http':
        return await this.httpRuntime.execute(handle, task);
      default:
        return {
          success: false,
          error: `Unsupported runtime: ${handle.runtime}`,
        };
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentHandle | undefined {
    return agentRegistry.get(id);
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): AgentHandle[] {
    return agentRegistry.getByType(type);
  }

  /**
   * List all agents
   */
  listAgents(): AgentHandle[] {
    return agentRegistry.list();
  }

  /**
   * Check agent health
   */
  async checkHealth(agentId: string): Promise<any> {
    const handle = agentRegistry.get(agentId);
    if (!handle) {
      return { status: 'unknown', error: 'Agent not found' };
    }

    switch (handle.runtime) {
      case 'in-process':
        return await this.inProcessRuntime.health(handle);
      case 'http':
        return await this.httpRuntime.health(handle);
      default:
        return { status: 'unknown', error: 'Unsupported runtime' };
    }
  }
}

// Singleton instance
export const orchestrator = new Orchestrator();

