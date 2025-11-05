/**
 * Shared types for Sutradhar client
 */

export interface AgentTask {
  id: string;
  type: string;
  payload: any;
  context?: {
    sessionId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    latency?: number;
    agentId?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface AgentDefinition {
  id: string;
  type: string;
  version?: string;
  runtime: 'in-process' | 'http' | 'container' | 'process';
  config?: {
    url?: string;
    image?: string;
    script?: string;
    env?: Record<string, string>;
    ports?: number[];
    healthEndpoint?: string;
    [key: string]: any;
  };
  implementation?: any;
  capabilities?: string[];
}

