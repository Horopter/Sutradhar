/**
 * In-Process Runtime - Runs agents in the same process
 */

import { AgentDefinition, AgentHandle, AgentTask, AgentResult } from '../types';

// IAgent interface for in-process agents
interface IAgent {
  id: string;
  type: string;
  execute(task: AgentTask): Promise<AgentResult>;
  health(): Promise<any>;
}

export class InProcessRuntime {
  async start(definition: AgentDefinition): Promise<AgentHandle> {
    if (!definition.implementation) {
      throw new Error('In-process agents require an implementation');
    }

    const AgentClass = definition.implementation;
    // Check if it's a class constructor or already an instance
    const instance: IAgent = typeof AgentClass === 'function' 
      ? new AgentClass() 
      : AgentClass;

    return {
      id: definition.id,
      type: definition.type,
      runtime: 'in-process',
      instance,
    };
  }

  async execute(handle: AgentHandle, task: AgentTask): Promise<AgentResult> {
    if (!handle.instance) {
      throw new Error('Agent instance not available');
    }

    const agent = handle.instance as IAgent;
    return await agent.execute(task);
  }

  async health(handle: AgentHandle): Promise<any> {
    if (!handle.instance) {
      return { status: 'unhealthy', error: 'Instance not available' };
    }

    const agent = handle.instance as IAgent;
    return await agent.health();
  }
}

