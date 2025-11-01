/**
 * Core types and interfaces for the scalable plugin architecture
 */

export interface PluginConfig {
  enabled: boolean;
  mock?: boolean;
  [key: string]: any;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  capabilities: string[];
}

/**
 * Base interface for all plugins
 */
export interface IPlugin {
  readonly metadata: PluginMetadata;
  readonly config: PluginConfig;
  
  initialize(config: PluginConfig): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  shutdown?(): Promise<void>;
}

export interface HealthStatus {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  message?: string;
  latency?: number;
  details?: Record<string, any>;
}

/**
 * Result wrapper for all plugin operations
 */
export interface PluginResult<T = any> {
  ok: boolean;
  mocked?: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

