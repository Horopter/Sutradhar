/**
 * Real Browser Plugin - Wraps existing Playwright automation
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import {
  IBrowserPlugin,
  BrowserActionPayload,
  BrowserActionResponse,
} from '../interfaces/browser-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { postToForum } from '../../browser/forum';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class BrowserRealPlugin extends BaseMockPlugin implements IBrowserPlugin {
  readonly metadata: PluginMetadata = {
    name: 'browser-real',
    version: '1.0.0',
    description: 'Real browser automation provider (Playwright)',
    capabilities: ['forum-post', 'screenshot', 'navigate'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('browser-playwright', {
    failureThreshold: 3,
    resetTimeout: 60000,
  });

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  listSupportedActions(): string[] {
    return ['forum-post', 'screenshot', 'navigate'];
  }

  async executeAction(
    action: string,
    payload: BrowserActionPayload
  ): Promise<PluginResult<BrowserActionResponse>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        switch (action) {
          case 'forum-post':
            return await postToForum({
              url: payload.url,
              username: payload.username,
              password: payload.password,
              text: payload.text,
            });

          default:
            throw new Error(`Unsupported browser action: ${action}`);
        }
      }) as any;

      return {
        ok: result.ok !== false,
        mocked: result.mocked || false,
        data: {
          ok: result.ok,
          screenshot: result.screenshot,
          url: result.url,
          data: result,
        },
      };
    } catch (error) {
      log.error(`Browser action failed: ${action}`, error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

