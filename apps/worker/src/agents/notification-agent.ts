/**
 * Notification Agent
 * Single responsibility: Handle forum posts and notifications
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { actionService } from '../core/services/action-service';
import { log } from '../log';

// Import communication service instance
let communicationServiceInstance: any = null;

async function getCommunicationService() {
  if (!communicationServiceInstance) {
    const { communicationService } = await import('../services/communication-service');
    communicationServiceInstance = communicationService;
  }
  return communicationServiceInstance;
}

export class NotificationAgent extends BaseAgent {
  constructor() {
    super('NotificationAgent', 'Handles forum posts and notifications');
  }

  /**
   * Post to forum using BrowserUse
   */
  async postToForum(
    text: string,
    url?: string,
    context?: AgentContext
  ): Promise<AgentResult<{ screenshot?: string; url?: string }>> {
    try {
      const result = await actionService.executeAction('forum', {
        text,
        url,
        sessionId: context?.sessionId || 'anonymous'
      });
      
      if (!result.ok) {
        return this.error(result.error || 'Failed to post to forum');
      }
      
      const data = result.data as any;
      return this.success({
        screenshot: data?.screenshot,
        url: data?.url
      });
    } catch (error: any) {
      log.error('NotificationAgent.postToForum failed', error);
      return this.error(error.message || 'Failed to post to forum');
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackMessage(
    text: string,
    channelId?: string,
    context?: AgentContext
  ): Promise<AgentResult<{ messageId: string }>> {
    try {
      const communicationService = await getCommunicationService();
      const result = await communicationService.sendMessage(
        {
          platform: 'slack',
          id: channelId || 'general',
          name: 'General'
        },
        {
          text,
          metadata: {
            sessionId: context?.sessionId
          }
        }
      );
      
      if (!result.success) {
        return this.error(result.error || 'Failed to send Slack message');
      }
      
      return this.success({
        messageId: result.messageId
      });
    } catch (error: any) {
      log.error('NotificationAgent.sendSlackMessage failed', error);
      return this.error(error.message || 'Failed to send Slack message');
    }
  }
}

