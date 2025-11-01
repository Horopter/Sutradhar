/**
 * Base Agent Interface
 * All agents inherit from this base class
 * Enforces single responsibility and consistent error handling
 */

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

export abstract class BaseAgent {
  protected name: string;
  protected description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
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
}

