/**
 * Agent Registry - Core orchestration registry
 */

import { AgentDefinition, AgentHandle } from './types';
import { InProcessRuntime } from './runtime/in-process';
import { HttpRuntime } from './runtime/http';

export class AgentRegistry {
  private agents: Map<string, AgentHandle> = new Map();
  private inProcessRuntime: InProcessRuntime;
  private httpRuntime: HttpRuntime;

  constructor() {
    this.inProcessRuntime = new InProcessRuntime();
    this.httpRuntime = new HttpRuntime();
  }

  /**
   * Register a new agent
   */
  async register(definition: AgentDefinition): Promise<AgentHandle> {
    let handle: AgentHandle;

    switch (definition.runtime) {
      case 'in-process':
        handle = await this.inProcessRuntime.start(definition);
        break;
      case 'http':
        handle = await this.httpRuntime.start(definition);
        break;
      case 'container':
        // TODO: Implement container runtime
        throw new Error('Container runtime not yet implemented');
      case 'process':
        // TODO: Implement process runtime
        throw new Error('Process runtime not yet implemented');
      default:
        throw new Error(`Unknown runtime: ${definition.runtime}`);
    }

    this.agents.set(definition.id, handle);
    return handle;
  }

  /**
   * Get agent by ID
   */
  get(id: string): AgentHandle | undefined {
    return this.agents.get(id);
  }

  /**
   * Get agents by type
   */
  getByType(type: string): AgentHandle[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  /**
   * List all agents
   */
  list(): AgentHandle[] {
    return Array.from(this.agents.values());
  }

  /**
   * Unregister agent
   */
  async unregister(id: string): Promise<void> {
    const handle = this.agents.get(id);
    if (!handle) return;

    // Cleanup based on runtime
    switch (handle.runtime) {
      case 'in-process':
        // No cleanup needed
        break;
      case 'http':
        // No cleanup needed
        break;
      case 'container':
        // TODO: Stop container
        break;
      case 'process':
        // TODO: Kill process
        break;
    }

    this.agents.delete(id);
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();

