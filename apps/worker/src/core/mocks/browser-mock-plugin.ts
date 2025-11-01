/**
 * Mock Browser Plugin - Sophisticated mock for browser automation
 */

import { BaseMockPlugin } from './base-mock-plugin';
import {
  IBrowserPlugin,
  BrowserActionPayload,
  BrowserActionResponse,
} from '../interfaces/browser-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { log } from '../../log';

interface MockBrowserAction {
  id: string;
  action: string;
  payload: BrowserActionPayload;
  result: BrowserActionResponse;
  timestamp: number;
}

export class BrowserMockPlugin extends BaseMockPlugin implements IBrowserPlugin {
  readonly metadata: PluginMetadata = {
    name: 'browser-mock',
    version: '1.0.0',
    description: 'Mock browser automation provider',
    capabilities: ['forum-post', 'screenshot', 'navigate'],
  };

  readonly config: PluginConfig;
  private actionStore: MockBrowserAction[] = [];

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
    await this.simulateLatency(500, 2000); // Browser actions take longer

    const actionId = this.generateId('browser');

    let result: BrowserActionResponse;

    switch (action) {
      case 'forum-post':
        result = await this.mockForumPost(payload);
        break;
      case 'screenshot':
        result = await this.mockScreenshot(payload);
        break;
      case 'navigate':
        result = await this.mockNavigate(payload);
        break;
      default:
        return this.mockError(`Unknown browser action: ${action}`);
    }

    // Store action
    this.actionStore.push({
      id: actionId,
      action,
      payload,
      result,
      timestamp: Date.now(),
    });

    // Keep last 500 actions
    if (this.actionStore.length > 500) {
      this.actionStore.shift();
    }

    log.info(`MOCK BROWSER: ${action}`, { actionId, url: payload.url });

    return this.mockSuccess(result, {
      actionId,
      actionCount: this.actionStore.length,
    });
  }

  private async mockForumPost(payload: BrowserActionPayload): Promise<BrowserActionResponse> {
    const screenshotId = `forum-${Date.now()}.png`;
    
    return {
      ok: true,
      screenshot: screenshotId,
      url: payload.url || 'https://mock-forum.example.com',
      data: {
        postId: this.generateId('post'),
        url: payload.url || 'https://mock-forum.example.com',
        text: payload.text,
      },
    };
  }

  private async mockScreenshot(payload: BrowserActionPayload): Promise<BrowserActionResponse> {
    const screenshotId = `screenshot-${Date.now()}.png`;
    
    return {
      ok: true,
      screenshot: screenshotId,
      url: payload.url,
      data: {
        screenshot: screenshotId,
        timestamp: Date.now(),
      },
    };
  }

  private async mockNavigate(payload: BrowserActionPayload): Promise<BrowserActionResponse> {
    return {
      ok: true,
      url: payload.url || 'https://example.com',
      data: {
        title: 'Mock Page Title',
        url: payload.url || 'https://example.com',
        loaded: true,
      },
    };
  }

  /**
   * Get mock browser actions (for testing/debugging)
   */
  getMockActions(filter?: { action?: string }): MockBrowserAction[] {
    let actions = [...this.actionStore];
    
    if (filter?.action) {
      actions = actions.filter(a => a.action === filter.action);
    }
    
    return actions;
  }

  /**
   * Clear mock action store
   */
  clearMockActions(): void {
    this.actionStore = [];
  }
}

