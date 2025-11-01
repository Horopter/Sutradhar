/**
 * Real Action Plugin - Wraps existing Composio integrations
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import {
  IActionPlugin,
  ActionType,
  BaseActionPayload,
  SlackActionPayload,
  CalendarActionPayload,
  GitHubActionPayload,
  ActionResponse,
} from '../interfaces/action-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { slackPostMessage } from '../../integrations/actions/slack';
import { createCalendarEvent } from '../../integrations/actions/calendar';
import { createGithubIssue } from '../../integrations/actions/github';
import { postToForum } from '../../browser/forum';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class ActionRealPlugin extends BaseMockPlugin implements IActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'action-real',
    version: '1.0.0',
    description: 'Real action provider (Rube.app integrations)',
    capabilities: ['slack', 'calendar', 'github', 'forum'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('action-rube', {
    failureThreshold: 5,
    resetTimeout: 30000,
  });

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
    try {
      const result = await this.circuitBreaker.execute(async () => {
        switch (type) {
          case 'slack': {
            const p = payload as unknown as SlackActionPayload;
            return await slackPostMessage(p.text, p.channelId);
          }

          case 'calendar': {
            const p = payload as unknown as CalendarActionPayload;
            return await createCalendarEvent(
              p.title,
              p.startISO,
              p.endISO,
              p.description,
              p.calendarId
            );
          }

          case 'github': {
            const p = payload as unknown as GitHubActionPayload;
            return await createGithubIssue(p.title, p.body || '', p.repoSlug);
          }

          case 'forum': {
            return await postToForum({
              url: (payload as any).url,
              username: (payload as any).username,
              password: (payload as any).password,
              text: (payload as any).text,
            });
          }

          default:
            throw new Error(`Unsupported action type: ${type}`);
        }
      }) as any;

      return {
        ok: result.ok !== false,
        mocked: result.mocked || false,
        data: result,
      };
    } catch (error) {
      log.error(`Action execution failed: ${type}`, error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

