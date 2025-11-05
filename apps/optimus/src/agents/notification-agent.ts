/**
 * Notification Agent - Optimus Layer
 * Uses Sutradhar orchestrator for notifications
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export class NotificationAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('NotificationAgent', 'Handles forum posts and notifications', sutradharClient);
  }

  async postToForum(text: string, url?: string, context?: AgentContext): Promise<AgentResult<{ screenshot?: string; url?: string }>> {
    try {
      // TODO: Use Sutradhar to call browser/forum agent
      return this.error('Post to forum not yet implemented - needs browser agent via Sutradhar');
    } catch (error: any) {
      return this.error(error.message || 'Failed to post to forum');
    }
  }

  async sendSlackMessage(text: string, channelId?: string, context?: AgentContext): Promise<AgentResult<{ messageId: string }>> {
    try {
      // Use Sutradhar action agent for Slack
      const result = await this.executeViaSutradhar(
        'action-agent',
        'execute',
        {
          actionType: 'slack',
          payload: {
            text,
            channelId: channelId || 'general',
            sessionId: context?.sessionId,
          },
        },
        context
      );

      if (!result.success) {
        return this.error(result.error || 'Failed to send Slack message');
      }

      return this.success({
        messageId: result.data?.messageId || 'unknown',
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to send Slack message');
    }
  }
}
