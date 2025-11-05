/**
 * Plugin Registry - Centralized management of all plugins
 * Supports hot-swapping, lazy loading, and dependency injection
 */

import { IPlugin, PluginConfig, PluginMetadata, HealthStatus } from './types';
import { log } from '../log';

export class PluginRegistry {
  private plugins: Map<string, IPlugin> = new Map();
  private configs: Map<string, PluginConfig> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * Register a plugin instance
   */
  register(name: string, plugin: IPlugin, config: PluginConfig): void {
    if (this.plugins.has(name)) {
      log.warn(`Plugin ${name} already registered, replacing...`);
    }
    this.plugins.set(name, plugin);
    this.configs.set(name, config);
    log.info(`Plugin registered: ${name}`, { capabilities: plugin.metadata.capabilities });
  }

  /**
   * Get a plugin instance (lazy initialization)
   */
  async get<T extends IPlugin>(name: string): Promise<T> {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin ${name} not registered`);
    }

    const plugin = this.plugins.get(name)!;
    
    // Lazy initialization
    if (!this.initialized.has(name)) {
      const config = this.configs.get(name)!;
      await plugin.initialize(config);
      this.initialized.add(name);
      log.info(`Plugin initialized: ${name}`);
    }

    return plugin as T;
  }

  /**
   * Check if plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugin names
   */
  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Replace a plugin (hot-swap)
   */
  async replace(name: string, plugin: IPlugin, config: PluginConfig): Promise<void> {
    const existingPlugin = this.plugins.get(name);
    if (existingPlugin && existingPlugin.shutdown) {
      await existingPlugin.shutdown();
      this.initialized.delete(name);
    }
    this.register(name, plugin, config);
    if (this.initialized.has(name)) {
      await plugin.initialize(config);
      this.initialized.add(name);
    }
    log.info(`Plugin replaced: ${name}`);
  }

  /**
   * Get health status of all plugins
   */
  async getHealthStatus(): Promise<Map<string, HealthStatus>> {
    const statuses = new Map<string, HealthStatus>();
    
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        const status = await plugin.healthCheck();
        statuses.set(name, status);
      } catch (error) {
        statuses.set(name, {
          healthy: false,
          status: 'down',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return statuses;
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = [];
    
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.shutdown) {
        shutdownPromises.push(
          plugin.shutdown().catch(error => {
            log.error(`Error shutting down plugin ${name}`, error);
          })
        );
      }
    }
    
    await Promise.all(shutdownPromises);
    this.plugins.clear();
    this.configs.clear();
    this.initialized.clear();
    log.info('All plugins shut down');
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

