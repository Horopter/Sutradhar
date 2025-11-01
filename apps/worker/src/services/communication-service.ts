/**
 * Communication Service
 * Unified interface for messaging across platforms (Slack, GitHub, Email)
 * Abstracts Composio, AgentMail, and direct API integrations
 */

import { slackPostMessage, slackListMessages, listSlackChannels, getSlackChannel } from '../integrations/actions/slack';
import { addGithubIssueComment, getGithubIssue, listGithubIssues } from '../integrations/actions/github';
import { emailService } from '../core/services/email-service';
import {
  Platform,
  Channel,
  MessageInput,
  ChannelMessage,
  MessageResult,
  MessageListOptions,
} from '../models/communication';
import { log } from '../log';
import { logger } from '../core/logging/logger';

export class CommunicationService {
  /**
   * Send a message to a channel
   */
  async sendMessage(channel: Channel, message: MessageInput): Promise<MessageResult> {
    const serviceLogger = logger.child({ service: 'communication', operation: 'sendMessage' });
    
    try {
      switch (channel.platform) {
        case 'slack':
          return await this._sendSlackMessage(channel, message);
        
        case 'github':
          return await this._sendGitHubMessage(channel, message);
        
        case 'email':
          return await this._sendEmailMessage(channel, message);
        
        default:
          throw new Error(`Unsupported platform: ${channel.platform}`);
      }
    } catch (error: any) {
      serviceLogger.error('Send message failed', {
        error: error.message,
        platform: channel.platform,
        channelId: channel.id,
      });
      return {
        success: false,
        messageId: '',
        channelId: channel.id,
        platform: channel.platform,
        timestamp: Date.now(),
        error: error.message,
      };
    }
  }

  /**
   * Get messages from a channel
   */
  async getMessages(channel: Channel, options?: MessageListOptions): Promise<ChannelMessage[]> {
    const serviceLogger = logger.child({ service: 'communication', operation: 'getMessages' });
    
    try {
      switch (channel.platform) {
        case 'slack':
          return await this._getSlackMessages(channel, options);
        
        case 'github':
          return await this._getGitHubMessages(channel, options);
        
        default:
          serviceLogger.warn('Get messages not supported', { platform: channel.platform });
          return [];
      }
    } catch (error: any) {
      serviceLogger.error('Get messages failed', {
        error: error.message,
        platform: channel.platform,
      });
      return [];
    }
  }

  /**
   * List channels for a platform
   */
  async listChannels(platform: Platform): Promise<Channel[]> {
    const serviceLogger = logger.child({ service: 'communication', operation: 'listChannels' });
    
    try {
      switch (platform) {
        case 'slack':
          return await this._listSlackChannels();
        
        case 'github':
          return await this._listGitHubChannels();
        
        default:
          return [];
      }
    } catch (error: any) {
      serviceLogger.error('List channels failed', { error: error.message, platform });
      return [];
    }
  }

  /**
   * Get a specific channel
   */
  async getChannel(id: string, platform: Platform): Promise<Channel | null> {
    const serviceLogger = logger.child({ service: 'communication', operation: 'getChannel' });
    
    try {
      switch (platform) {
        case 'slack':
          return await this._getSlackChannel(id);
        
        case 'github':
          return await this._getGitHubChannel(id);
        
        default:
          return null;
      }
    } catch (error: any) {
      serviceLogger.error('Get channel failed', { error: error.message, platform, id });
      return null;
    }
  }

  // Private helper methods for platform-specific operations

  private async _sendSlackMessage(channel: Channel, message: MessageInput): Promise<MessageResult> {
    try {
      const result: any = await slackPostMessage(message.text, channel.id, message.threadId);
      
      return {
        success: true,
        messageId: result.ts || result.messageId || `msg-${Date.now()}`,
        channelId: channel.id,
        platform: 'slack',
        threadId: message.threadId,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      throw new Error(`Slack send failed: ${error.message}`);
    }
  }

  private async _sendGitHubMessage(channel: Channel, message: MessageInput): Promise<MessageResult> {
    try {
      // Parse channel ID as "owner/repo#issueNumber"
      const [repoSlug, issueNumStr] = channel.id.split('#');
      const issueNumber = parseInt(issueNumStr, 10);
      const [owner, repo] = repoSlug.split('/');

      if (!owner || !repo || !issueNumber) {
        throw new Error(`Invalid GitHub channel format: ${channel.id}`);
      }

      const result: any = await addGithubIssueComment(owner, repo, issueNumber, message.text);

      return {
        success: true,
        messageId: result.id?.toString() || `comment-${Date.now()}`,
        channelId: channel.id,
        platform: 'github',
        threadId: issueNumber.toString(),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      throw new Error(`GitHub send failed: ${error.message}`);
    }
  }

  private async _sendEmailMessage(channel: Channel, message: MessageInput): Promise<MessageResult> {
    try {
      const result = await emailService.sendEmail({
        to: [channel.id], // Channel ID is email address for email platform
        subject: message.metadata?.subject || 'Message from Sutradhar',
        text: message.text,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Email send failed');
      }

      return {
        success: true,
        messageId: result.data.messageId || `email-${Date.now()}`,
        channelId: channel.id,
        platform: 'email',
        threadId: result.data.threadId,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  private async _getSlackMessages(channel: Channel, options?: MessageListOptions): Promise<ChannelMessage[]> {
    try {
      const result: any = await slackListMessages(channel.id, options?.limit || 50);
      const messages = Array.isArray(result) ? result : (result.messages || []);

      return messages.map((msg: any) => ({
        id: msg.ts || msg.id || `msg-${Date.now()}`,
        channelId: channel.id,
        platform: 'slack',
        text: msg.text || msg.message || '',
        author: {
          id: msg.user || msg.userId || 'unknown',
          name: msg.userName || msg.user?.name || 'Unknown',
          avatar: msg.user?.image || msg.avatar,
        },
        timestamp: typeof msg.ts === 'string' ? parseFloat(msg.ts) * 1000 : (msg.timestamp || Date.now()),
        threadId: msg.thread_ts || msg.threadId,
        metadata: msg,
      }));
    } catch (error: any) {
      log.error('Get Slack messages failed', { error: error.message });
      return [];
    }
  }

  private async _getGitHubMessages(channel: Channel, options?: MessageListOptions): Promise<ChannelMessage[]> {
    try {
      // Parse channel ID as "owner/repo#issueNumber"
      const [repoSlug, issueNumStr] = channel.id.split('#');
      const issueNumber = parseInt(issueNumStr, 10);
      const [owner, repo] = repoSlug.split('/');

      if (!owner || !repo || !issueNumber) {
        return [];
      }

      const issue: any = await getGithubIssue(owner, repo, issueNumber);
      const comments = issue.comments || [];

      const messages: ChannelMessage[] = [
        // Issue body as first message
        {
          id: `issue-${issueNumber}`,
          channelId: channel.id,
          platform: 'github',
          text: issue.body || '',
          author: {
            id: issue.user?.login || 'unknown',
            name: issue.user?.login || 'Unknown',
            avatar: issue.user?.avatar_url,
          },
          timestamp: new Date(issue.created_at).getTime(),
          metadata: issue,
        },
        // Comments
        ...comments.map((comment: any) => ({
          id: `comment-${comment.id}`,
          channelId: channel.id,
          platform: 'github',
          text: comment.body || '',
          author: {
            id: comment.user?.login || 'unknown',
            name: comment.user?.login || 'Unknown',
            avatar: comment.user?.avatar_url,
          },
          timestamp: new Date(comment.created_at).getTime(),
          threadId: issueNumber.toString(),
          metadata: comment,
        })),
      ];

      return messages.slice(0, options?.limit || messages.length);
    } catch (error: any) {
      log.error('Get GitHub messages failed', { error: error.message });
      return [];
    }
  }

  private async _listSlackChannels(): Promise<Channel[]> {
    try {
      const result: any = await listSlackChannels();
      const channels = Array.isArray(result) ? result : (result.channels || []);

      return channels.map((ch: any) => ({
        id: ch.id || ch.channelId,
        platform: 'slack' as Platform,
        name: ch.name || ch.channelName || '',
        type: ch.is_private ? 'private' : 'public',
        metadata: {
          url: ch.url,
          workspace: ch.workspace,
          members: ch.num_members || ch.memberCount,
        },
      }));
    } catch (error: any) {
      log.error('List Slack channels failed', { error: error.message });
      return [];
    }
  }

  private async _getSlackChannel(id: string): Promise<Channel | null> {
    try {
      const result: any = await getSlackChannel(id);
      
      if (!result) return null;

      return {
        id: result.id || id,
        platform: 'slack',
        name: result.name || '',
        type: result.is_private ? 'private' : 'public',
        metadata: {
          url: result.url,
          workspace: result.workspace,
          members: result.num_members,
        },
      };
    } catch (error: any) {
      log.error('Get Slack channel failed', { error: error.message, id });
      return null;
    }
  }

  private async _listGitHubChannels(): Promise<Channel[]> {
    try {
      // For GitHub, channels are repositories
      // This would need to be implemented based on available GitHub repos
      // For now, return empty array - this should be configured per installation
      return [];
    } catch (error: any) {
      log.error('List GitHub channels failed', { error: error.message });
      return [];
    }
  }

  private async _getGitHubChannel(id: string): Promise<Channel | null> {
    try {
      // Parse "owner/repo" or "owner/repo#issueNumber"
      const [repoSlug] = id.split('#');
      const [owner, repo] = repoSlug.split('/');

      if (!owner || !repo) {
        return null;
      }

      // Get issues as "channels"
      const issues: any = await listGithubIssues(owner, repo);
      const issueList = Array.isArray(issues) ? issues : (issues.issues || []);

      // For now, return the repo as a channel
      // Individual issues would be sub-channels
      return {
        id: `${owner}/${repo}`,
        platform: 'github',
        name: repo,
        type: 'public',
        metadata: {
          url: `https://github.com/${owner}/${repo}`,
          issueCount: issueList.length,
        },
      };
    } catch (error: any) {
      log.error('Get GitHub channel failed', { error: error.message, id });
      return null;
    }
  }
}

export const communicationService = new CommunicationService();

