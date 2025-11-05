/**
 * Mock Action Plugin - Sophisticated mock for all integration actions
 */

import { BaseMockPlugin } from './base-mock-plugin';
import {
  IActionPlugin,
  ActionType,
  BaseActionPayload,
  SlackActionPayload,
  CalendarActionPayload,
  GitHubActionPayload,
  ForumActionPayload,
  ActionResponse,
} from '../interfaces/action-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { log } from '../../log';

interface MockAction {
  id: string;
  type: ActionType;
  payload: any;
  result: any;
  timestamp: number;
}

export class ActionMockPlugin extends BaseMockPlugin implements IActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'action-mock',
    version: '1.0.0',
    description: 'Mock action provider for all integrations',
    capabilities: ['slack', 'calendar', 'github', 'forum'],
  };

  readonly config: PluginConfig;
  private actionStore: MockAction[] = [];

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  listSupportedActions(): ActionType[] {
    return ['slack', 'calendar', 'github', 'forum'];
  }

  validateAction(type: ActionType, payload: any): boolean {
    switch (type) {
      case 'slack':
        return !!payload?.text;
      case 'calendar':
        return !!payload?.title && !!payload?.startISO && !!payload?.endISO;
      case 'github':
        return !!payload?.title;
      case 'forum':
        return !!payload?.text;
      default:
        return false;
    }
  }

  async executeAction<T extends BaseActionPayload>(
    type: ActionType,
    payload: T
  ): Promise<PluginResult<ActionResponse>> {
    await this.simulateLatency(100, 300);

    if (!this.validateAction(type, payload)) {
      return this.mockError(`Invalid ${type} payload`);
    }

    const result = this.generateMockResult(type, payload);
    const actionId = this.generateId('action');

    // Store action for audit trail
    this.actionStore.push({
      id: actionId,
      type,
      payload,
      result,
      timestamp: Date.now(),
    });

    // Keep last 1000 actions
    if (this.actionStore.length > 1000) {
      this.actionStore.shift();
    }

    log.info(`MOCK ACTION: ${type}`, { actionId, payload });

    return this.mockSuccess<ActionResponse>({
      ok: true,
      data: result,
    }, {
      actionId,
      actionCount: this.actionStore.length,
    });
  }

  private generateMockResult(type: ActionType, payload: any): any {
    switch (type) {
      case 'slack': {
        const p = payload as SlackActionPayload;
        return {
          ok: true,
          ts: Date.now().toString(),
          channel: p.channelId || 'mock-channel',
          permalink: `https://mock-slack.slack.com/archives/mock-channel/p${Date.now()}`,
          message: {
            text: p.text,
            permalink: `https://mock-slack.slack.com/archives/mock-channel/p${Date.now()}`,
          },
        };
      }

      case 'calendar': {
        const p = payload as CalendarActionPayload;
        const eventId = this.generateId('event');
        return {
          id: eventId,
          summary: p.title,
          start: { dateTime: p.startISO },
          end: { dateTime: p.endISO },
          htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
          description: p.description || '',
        };
      }

      case 'github': {
        const p = payload as GitHubActionPayload;
        const issueNumber = Math.floor(Math.random() * 1000);
        return {
          number: issueNumber,
          title: p.title,
          body: p.body || '',
          html_url: `https://github.com/${p.repoSlug || 'mock/repo'}/issues/${issueNumber}`,
          url: `https://api.github.com/repos/${p.repoSlug || 'mock/repo'}/issues/${issueNumber}`,
          state: 'open',
        };
      }

      case 'forum': {
        return {
          ok: true,
          url: payload.url || 'https://mock-forum.example.com',
          postId: this.generateId('post'),
          screenshot: `mock-screenshot-${Date.now()}.png`,
        };
      }

      default:
        return { ok: true, note: `Mock ${type} action executed` };
    }
  }

  /**
   * Get mock actions (for testing/debugging)
   */
  getMockActions(filter?: { type?: ActionType; sessionId?: string }): MockAction[] {
    let actions = [...this.actionStore];
    
    if (filter?.type) {
      actions = actions.filter(a => a.type === filter.type);
    }
    
    if (filter?.sessionId) {
      actions = actions.filter(a => a.payload?.sessionId === filter.sessionId);
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

