/**
 * Base Agent Interface for Optimus
 * Agents use SutradharClient to execute tasks via orchestrator
 */

import { SutradharClient } from '../client/sutradhar-client';
import { AgentTask, AgentResult } from '../sutradhar-client/types';

export { AgentResult } from '../sutradhar-client/types';

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected sutradharClient: SutradharClient;

  constructor(name: string, description: string, sutradharClient: SutradharClient) {
    this.name = name;
    this.description = description;
    this.sutradharClient = sutradharClient;
  }

  /**
   * Get agent metadata
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      type: this.constructor.name,
    };
  }

  /**
   * Validate context
   */
  protected validateContext(context?: AgentContext): AgentContext {
    return context || {};
  }

  /**
   * Create success result
   */
  protected success<T>(data: T, metadata?: Record<string, any>): AgentResult<T> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Create error result
   */
  protected error(error: string, metadata?: Record<string, any>): AgentResult {
    return {
      success: false,
      error,
      metadata,
    };
  }

  /**
   * Execute a task via Sutradhar orchestrator
   */
  protected async executeViaSutradhar(
    agentId: string,
    taskType: string,
    payload: any,
    context?: AgentContext
  ): Promise<AgentResult> {
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      payload,
      context: {
        sessionId: context?.sessionId,
        userId: context?.userId,
        requestId: context?.requestId,
      },
    };

    return await this.sutradharClient.executeTask(agentId, task);
  }

  /**
   * Execute a Convex query via Sutradhar data-agent
   */
  protected async convexQuery(path: string, args: any = {}, context?: AgentContext): Promise<any> {
    const result = await this.executeViaSutradhar(
      'data-agent',
      'query',
      { path, args },
      context
    );

    if (!result.success) {
      return null;
    }

    return result.data;
  }

  /**
   * Execute a Convex mutation via Sutradhar data-agent
   */
  protected async convexMutation(path: string, args: any = {}, context?: AgentContext): Promise<any> {
    const result = await this.executeViaSutradhar(
      'data-agent',
      'mutation',
      { path, args },
      context
    );

    if (!result.success) {
      return null;
    }

    return result.data;
  }
}
