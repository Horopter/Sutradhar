/**
 * HTTP Runtime - External HTTP agents
 */

// @ts-ignore - node-fetch types may not be available
import fetch from 'node-fetch';
import { AgentDefinition, AgentHandle, AgentTask, AgentResult } from '../types';

export class HttpRuntime {
  async start(definition: AgentDefinition): Promise<AgentHandle> {
    if (!definition.config?.url) {
      throw new Error('HTTP agents require a URL in config');
    }

    // Verify agent is reachable
    const healthUrl = definition.config.healthEndpoint 
      ? `${definition.config.url}${definition.config.healthEndpoint}`
      : `${definition.config.url}/health`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Agent health check failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Agent health check failed, but continuing: ${error}`);
    }

    return {
      id: definition.id,
      type: definition.type,
      runtime: 'http',
      endpoint: definition.config.url,
    };
  }

  async execute(handle: AgentHandle, task: AgentTask): Promise<AgentResult> {
    if (!handle.endpoint) {
      throw new Error('Agent endpoint not available');
    }

    const executeUrl = `${handle.endpoint}/execute`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(executeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json() as AgentResult;
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to execute HTTP agent',
      };
    }
  }

  async health(handle: AgentHandle): Promise<any> {
    if (!handle.endpoint) {
      return { status: 'unhealthy', error: 'Endpoint not available' };
    }

    const healthUrl = `${handle.endpoint}/health`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return { status: 'healthy', lastCheck: Date.now() };
      }
      return { status: 'unhealthy', error: `HTTP ${response.status}` };
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

