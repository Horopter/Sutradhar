/**
 * Base Mock Plugin Implementation
 * All mock plugins extend this for consistent behavior
 */

import { IPlugin, PluginConfig, PluginMetadata, HealthStatus, PluginResult } from '../types';
import { nanoid } from 'nanoid';
import { log } from '../../log';

export abstract class BaseMockPlugin implements IPlugin {
  protected initialized = false;
  protected mockDataStore: Map<string, any> = new Map();

  abstract readonly metadata: PluginMetadata;
  abstract readonly config: PluginConfig;

  async initialize(config: PluginConfig): Promise<void> {
    this.initialized = true;
    log.info(`Mock plugin initialized: ${this.metadata.name}`);
  }

  async healthCheck(): Promise<HealthStatus> {
    const pluginName = this.metadata.name.replace('-mock', '').replace('-real', '');
    return {
      healthy: true,
      status: 'healthy',
      message: `${pluginName} plugin is operational`,
      latency: Math.floor(Math.random() * 50), // Mock latency
    };
  }

  /**
   * Generate realistic mock IDs
   */
  protected generateId(prefix: string): string {
    return `mock-${prefix}_${nanoid(10)}`;
  }

  /**
   * Simulate network latency
   */
  protected async simulateLatency(min = 10, max = 100): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Create a successful mock result
   */
  protected mockSuccess<T>(data: T, metadata?: Record<string, any>): PluginResult<T> {
    return {
      ok: true,
      mocked: true,
      data,
      metadata,
    };
  }

  /**
   * Create an error mock result
   */
  protected mockError<T>(message: string): PluginResult<T> {
    return {
      ok: false,
      mocked: true,
      error: message,
    };
  }

  /**
   * Store mock data (for stateful mocks)
   */
  protected setMockData(key: string, value: any): void {
    this.mockDataStore.set(key, value);
  }

  /**
   * Retrieve mock data
   */
  protected getMockData<T>(key: string): T | undefined {
    return this.mockDataStore.get(key) as T | undefined;
  }
}

