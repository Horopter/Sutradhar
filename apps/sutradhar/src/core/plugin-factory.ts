/**
 * Plugin Factory - Creates plugin instances based on configuration
 */

import { IPlugin, PluginConfig } from './types';
import { pluginRegistry } from './plugin-registry';
import { env } from '../env';

import { EmailMockPlugin } from './mocks/email-mock-plugin';
import { ActionMockPlugin } from './mocks/action-mock-plugin';
import { LLMMockPlugin } from './mocks/llm-mock-plugin';
import { RetrievalMockPlugin } from './mocks/retrieval-mock-plugin';
import { DataMockPlugin } from './mocks/data-mock-plugin';
import { ConvexPlugin } from './plugins/convex-plugin';

import { log } from '../log';

/**
 * Determine if a plugin should use mock mode
 */
function shouldUseMock(pluginName: string, config: PluginConfig): boolean {
  if (config.mock !== undefined) {
    return config.mock;
  }

  switch (pluginName) {
    case 'email':
      return !env.AGENTMAIL_API_KEY;
    case 'action':
      return String(env.MOCK_ACTIONS || 'false').toLowerCase() === 'true' || !(env.RUBE_API_KEY || env.RUBE_PROJECT_ID || env.COMPOSIO_API_KEY);
    case 'llm':
      return String(env.MOCK_LLM || 'true').toLowerCase() === 'true';
    case 'retrieval':
      return String(env.MOCK_RETRIEVAL || 'true').toLowerCase() === 'true';
    case 'data':
      return !env.CONVEX_URL;
    default:
      return false;
  }
}

/**
 * Create plugin instance
 */
function createPlugin(pluginName: string, config: PluginConfig): IPlugin {
  const useMock = shouldUseMock(pluginName, config);

  switch (pluginName) {
    case 'email':
      return new EmailMockPlugin({ ...config, mock: useMock });

    case 'action':
      return new ActionMockPlugin({ ...config, mock: useMock });

    case 'llm':
      return new LLMMockPlugin({ ...config, mock: useMock, defaultProvider: env.LLM_DEFAULT_PROVIDER });

    case 'retrieval':
      return new RetrievalMockPlugin({ ...config, mock: useMock });

    case 'data':
      return useMock
        ? new DataMockPlugin({ ...config, mock: true })
        : new ConvexPlugin({ ...config, mock: false });

    default:
      throw new Error(`Unknown plugin: ${pluginName}`);
  }
}

/**
 * Initialize all plugins
 */
export async function initializePlugins(): Promise<void> {
  log.info('Initializing plugins...');

  const plugins = [
    {
      name: 'email',
      config: {
        enabled: true,
        fromAddress: env.AGENTMAIL_FROM_ADDRESS,
        fromName: env.AGENTMAIL_FROM_NAME,
      } as PluginConfig,
    },
    {
      name: 'action',
      config: {
        enabled: true,
      } as PluginConfig,
    },
    {
      name: 'llm',
      config: {
        enabled: true,
      } as PluginConfig,
    },
    {
      name: 'retrieval',
      config: {
        enabled: true,
      } as PluginConfig,
    },
    {
      name: 'data',
      config: {
        enabled: true,
      } as PluginConfig,
    },
  ];

  for (const { name, config } of plugins) {
    try {
      const plugin = createPlugin(name, config);
      pluginRegistry.register(name, plugin, config);
      log.info(`Plugin configured: ${name} (${shouldUseMock(name, config) ? 'mock' : 'real'})`);
    } catch (error) {
      log.error(`Failed to create plugin ${name}`, error);
    }
  }

  log.info('Plugins initialized');
}

/**
 * Shutdown all plugins gracefully
 */
export async function shutdownPlugins(): Promise<void> {
  log.info('Shutting down plugins...');
  await pluginRegistry.shutdown();
  log.info('Plugins shut down');
}
