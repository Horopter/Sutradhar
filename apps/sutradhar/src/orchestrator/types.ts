/**
 * Sutradhar Orchestrator - Core Types
 * Agent-agnostic orchestration types
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
  implementation?: any; // For in-process agents
  capabilities?: string[];
}

export interface AgentHandle {
  id: string;
  type: string;
  runtime: string;
  instance?: any;
  endpoint?: string;
  containerId?: string;
  processId?: number;
  health?: HealthStatus;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck?: number;
  error?: string;
  latency?: number;
}

export interface IAgent {
  id: string;
  type: string;
  version?: string;
  
  capabilities?(): string[];
  execute(task: AgentTask): Promise<AgentResult>;
  health(): Promise<HealthStatus>;
  metrics?(): Promise<Record<string, any>>;
}

