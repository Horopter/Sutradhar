/**
 * Plugin Factory - Creates appropriate plugin instances based on configuration
 */

import { IPlugin, PluginConfig } from './types';
import { pluginRegistry } from './plugin-registry';
import { env } from '../env';

// Mock plugins
import { EmailMockPlugin } from './mocks/email-mock-plugin';
import { ActionMockPlugin } from './mocks/action-mock-plugin';
import { LLMMockPlugin } from './mocks/llm-mock-plugin';
import { RetrievalMockPlugin } from './mocks/retrieval-mock-plugin';
import { BrowserMockPlugin } from './mocks/browser-mock-plugin';
import { DataMockPlugin } from './mocks/data-mock-plugin';

// Real plugins
import { EmailRealPlugin } from './plugins/email-real-plugin';
import { ActionRealPlugin } from './plugins/action-real-plugin';
import { LLMRealPlugin } from './plugins/llm-real-plugin';
import { RetrievalRealPlugin } from './plugins/retrieval-real-plugin';
import { BrowserRealPlugin } from './plugins/browser-real-plugin';
import { DataConvexPlugin } from './plugins/data-convex-plugin';

import { log } from '../log';

/**
 * Determine if a plugin should use mock mode
 */
function shouldUseMock(pluginName: string, config: PluginConfig): boolean {
  // Explicit config override
  if (config.mock !== undefined) {
    return config.mock;
  }

  // Environment variable based
  switch (pluginName) {
    case 'email':
      return !env.AGENTMAIL_API_KEY;
    case 'action':
      return String(env.MOCK_ACTIONS || 'false').toLowerCase() === 'true' || !(env.RUBE_API_KEY || env.RUBE_PROJECT_ID || env.COMPOSIO_API_KEY);
    case 'llm':
      return String(env.MOCK_LLM || 'true').toLowerCase() === 'true';
    case 'retrieval':
      return String(env.MOCK_RETRIEVAL || 'true').toLowerCase() === 'true';
    case 'browser':
      return String(env.MOCK_BROWSER || 'true').toLowerCase() === 'true';
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
      return useMock 
        ? new EmailMockPlugin({ ...config, mock: true })
        : new EmailRealPlugin({ ...config, mock: false });

    case 'action':
      return useMock
        ? new ActionMockPlugin({ ...config, mock: true })
        : new ActionRealPlugin({ ...config, mock: false });

    case 'llm':
      return useMock
        ? new LLMMockPlugin({ ...config, mock: true, defaultProvider: env.LLM_DEFAULT_PROVIDER })
        : new LLMRealPlugin({ ...config, mock: false, defaultProvider: env.LLM_DEFAULT_PROVIDER });

    case 'retrieval':
      return useMock
        ? new RetrievalMockPlugin({ ...config, mock: true })
        : new RetrievalRealPlugin({ ...config, mock: false });

    case 'browser':
      return useMock
        ? new BrowserMockPlugin({ ...config, mock: true })
        : new BrowserRealPlugin({ ...config, mock: false });

    case 'data':
      return useMock
        ? new DataMockPlugin({ ...config, mock: true })
        : new DataConvexPlugin({ ...config, mock: false });

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
      name: 'browser',
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

