/**
 * Sutradhar Client - For Optimus to communicate with Sutradhar Orchestrator
 */

import fetch from 'node-fetch';
import { AgentDefinition, AgentTask, AgentResult } from '../sutradhar-client/types';

export class SutradharClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.SUTRADHAR_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Register an agent with Sutradhar
   */
  async registerAgent(definition: AgentDefinition): Promise<{ ok: boolean; agent?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orchestrator/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });

      const result = await response.json() as { ok: boolean; agents?: any[]; error?: string };
      return result;
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to register agent',
      };
    }
  }

  /**
   * Execute a task via Sutradhar orchestrator
   */
  async executeTask(agentId: string, task: AgentTask): Promise<AgentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/orchestrator/tasks/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, task }),
      });

      const result = await response.json() as AgentResult;
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to execute task',
      };
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<{ ok: boolean; agent?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orchestrator/agents/${agentId}`);
      const result = await response.json() as { ok: boolean; agents?: any[]; error?: string };
      return result;
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to get agent',
      };
    }
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<{ ok: boolean; agents?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orchestrator/agents`);
      const result = await response.json() as { ok: boolean; agents?: any[]; error?: string };
      return result;
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to list agents',
      };
    }
  }

  /**
   * Check agent health
   */
  async checkHealth(agentId: string): Promise<{ ok: boolean; health?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orchestrator/agents/${agentId}/health`);
      const result = await response.json() as { ok: boolean; health?: any; error?: string };
      return result;
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Failed to check health',
      };
    }
  }
}

