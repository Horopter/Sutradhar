/**
 * Slack Integration
 * Complete Slack operations via Composio SDK
 */

import { safeAction } from "./client";
import { env } from "../../env";
import { log } from "../../log";
import { ComposioToolSet } from "composio-core";

// ============================================================================
// Interfaces for mocking and type safety
// ============================================================================

export interface SlackChannel {
  id: string;
  name: string;
  is_archived?: boolean;
  is_private?: boolean;
}

export interface SlackMessage {
  ts: string;
  text: string;
  user?: string;
  channel?: string;
  permalink?: string;
  thread_ts?: string; // Thread timestamp if this is a threaded message
}

export interface SlackChannelListOptions {
  types?: string;
  excludeArchived?: boolean;
}

export interface SlackService {
  postMessage(text: string, channelId?: string): Promise<any>;
  listMessages(channelId: string, limit?: number): Promise<SlackMessage[]>;
  deleteMessage(channelId: string, messageTs: string): Promise<any>;
  listChannels(options?: SlackChannelListOptions): Promise<SlackChannel[]>;
  getChannel(channelId: string): Promise<SlackChannel>;
  updateMessage(channelId: string, ts: string, text: string, blocks?: any[]): Promise<any>;
  getMessage(channelId: string, ts: string): Promise<SlackMessage | null>;
}

// ============================================================================
// Helper functions - NO hardcoded IDs, throw errors if missing
// ============================================================================

function getSlackConnectedAccountId(): string {
  const id = env.SLACK_CONNECTED_ACCOUNT_ID;
  if (!id) {
    throw new Error('SLACK_CONNECTED_ACCOUNT_ID not configured. Set it in .secrets.env');
  }
  return id;
}

function getComposioUserId(): string {
  const userId = env.COMPOSIO_USER_ID || env.RUBE_USER_ID;
  if (!userId) {
    throw new Error('COMPOSIO_USER_ID or RUBE_USER_ID not configured. Set it in .secrets.env');
  }
  return userId;
}

function getComposioApiKey(): string {
  const apiKey = env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY not configured. Set it in .secrets.env');
  }
  return apiKey;
}

function getDefaultChannelId(): string {
  const channelId = env.SLACK_CHANNEL_ID;
  if (!channelId) {
    throw new Error('SLACK_CHANNEL_ID not configured. Set it in .secrets.env or pass channelId parameter');
  }
  return channelId;
}

function createComposioClient(): ComposioToolSet {
  return new ComposioToolSet({ apiKey: getComposioApiKey() });
}

// ============================================================================
// Slack Operations
// ============================================================================

/**
 * Send a message to a Slack channel
 */
export async function slackPostMessage(text: string, channelId?: string, threadTs?: string) {
  const channel = channelId || getDefaultChannelId();
  
  return safeAction("slack", { channel, text, threadTs }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      log.info('Executing Slack action with connectedAccountId');
      const params: any = {
        channel: channel.replace(/^#/, ''), // Remove # prefix if present
        text
      };
      
      // Add thread_ts if provided (reply in thread)
      if (threadTs) {
        params.thread_ts = threadTs;
      }
      
      const result: any = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_SEND_MESSAGE",
        params
      });
      
      if (result) {
        const data: any = result.data || result;
        const ts = data?.ts || data?.message_ts;
        const permalink = data?.permalink || (data?.message as any)?.permalink;
        if (ts) {
          log.info(`💬 Slack message sent: ts=${ts}, permalink=${permalink || 'N/A'}`);
        }
      }
      
      return result;
    } catch (connectedAccountError: any) {
      log.warn(`Failed with connectedAccountId, trying with entityId: ${connectedAccountError.message}`);
      
      try {
        log.info('Executing Slack action with entityId');
        const params: any = {
          channel: channel.replace(/^#/, ''),
          text
        };
        
        if (threadTs) {
          params.thread_ts = threadTs;
        }
        
        const result: any = await composio.executeAction({
          entityId,
          action: "SLACK_SEND_MESSAGE",
          params
        });
        
        if (result) {
          const data: any = result.data || result;
          const ts = data?.ts || data?.message_ts;
          const permalink = data?.permalink || (data?.message as any)?.permalink;
          if (ts) {
            log.info(`💬 Slack message sent: ts=${ts}, permalink=${permalink || 'N/A'}`);
          }
        }
        
        return result;
      } catch (entityError: any) {
        const errorMsg = entityError?.message || String(entityError);
        log.error(`Both connectedAccountId and entityId failed: ${errorMsg}`);
        
        if (errorMsg.includes('Could not find a connection')) {
          throw new Error(`${errorMsg}. Please ensure Slack connection is configured in Composio dashboard.`);
        }
        if (errorMsg.includes('not_in_channel') || errorMsg.includes('not in channel')) {
          throw new Error(`${errorMsg}. Hint: Invite the Composio bot to channel ${channel}.`);
        }
        if (errorMsg.includes('channel_not_found') || errorMsg.includes('channel not found')) {
          throw new Error(`${errorMsg}. Hint: Double-check channel ID ${channel}.`);
        }
        throw entityError;
      }
    }
  });
}

/**
 * List messages in a Slack channel
 */
export async function slackListMessages(channelId: string, limit: number = 100): Promise<SlackMessage[]> {
  const channel = channelId || getDefaultChannelId();
  
  const result = await safeAction("slack-list", { channel, limit }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      log.info('Listing Slack messages with connectedAccountId');
      const result: any = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_LIST_MESSAGES",
        params: {
          channel: channel.replace(/^#/, ''),
          limit
        }
      });
      
      if (result && result.data) {
        const messages = result.data.messages || (Array.isArray(result.data) ? result.data : []);
        log.info(`📋 Found ${messages.length} messages in channel`);
        return messages;
      }
      return [];
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result: any = await composio.executeAction({
        entityId,
        action: "SLACK_LIST_MESSAGES",
        params: {
          channel: channel.replace(/^#/, ''),
          limit
        }
      });
      
      if (result && result.data) {
        const messages = result.data.messages || (Array.isArray(result.data) ? result.data : []);
        return messages;
      }
      return [];
    }
  });
  
  if (result.mocked) {
    return [];
  }
  return (result.result as SlackMessage[]) || [];
}

/**
 * Delete a Slack message
 */
export async function slackDeleteMessage(channelId: string, messageTs: string) {
  const channel = channelId || getDefaultChannelId();
  
  return safeAction("slack-delete", { channel, ts: messageTs }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      log.info('Deleting Slack message with connectedAccountId');
      const result: any = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_DELETE_MESSAGE",
        params: {
          channel: channel.replace(/^#/, ''),
          ts: messageTs
        }
      });
      
      log.info('✅ Message deleted successfully');
      return result;
    } catch (connectedAccountError: any) {
      log.warn(`Failed with connectedAccountId, trying with entityId: ${connectedAccountError.message}`);
      
      try {
        log.info('Deleting Slack message with entityId');
        const result: any = await composio.executeAction({
          entityId,
          action: "SLACK_DELETE_MESSAGE",
          params: {
            channel: channel.replace(/^#/, ''),
            ts: messageTs
          }
        });
        
        log.info('✅ Message deleted successfully');
        return result;
      } catch (entityError: any) {
        const errorMsg = entityError?.message || String(entityError);
        log.error(`Both connectedAccountId and entityId failed for delete: ${errorMsg}`);
        throw entityError;
      }
    }
  });
}

/**
 * List channels
 */
export async function listSlackChannels(options?: SlackChannelListOptions): Promise<SlackChannel[]> {
  const result = await safeAction("slack-list-channels", { options }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_LIST_CHANNELS",
        params: {
          types: options?.types || 'public_channel,private_channel',
          exclude_archived: options?.excludeArchived,
        }
      });
      return result.data?.channels || result.data || result || [];
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "SLACK_LIST_CHANNELS",
        params: {
          types: options?.types || 'public_channel',
        }
      });
      return result.data?.channels || result.data || result || [];
    }
  });
  
  if (result.mocked) {
    return [];
  }
  return (result.result as SlackChannel[]) || [];
}

/**
 * Get channel information
 */
export async function getSlackChannel(channelId: string): Promise<SlackChannel> {
  const result = await safeAction("slack-get-channel", { channelId }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_GET_CHANNEL_INFO",
        params: { channel: channelId }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "SLACK_GET_CHANNEL_INFO",
        params: { channel: channelId }
      });
      return result.data || result;
    }
  });
  
  return ((result.result as unknown as SlackChannel) || ((result as any).data as unknown as SlackChannel) || (result as unknown as SlackChannel)) as SlackChannel;
}

/**
 * Update a message
 */
export async function updateSlackMessage(
  channelId: string,
  ts: string,
  text: string,
  blocks?: any[]
): Promise<any> {
  return safeAction("slack-update-message", { channelId, ts, text, blocks }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_UPDATE_MESSAGE",
        params: {
          channel: channelId.replace(/^#/, ''),
          ts,
          text,
          blocks,
        }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "SLACK_UPDATE_MESSAGE",
        params: {
          channel: channelId.replace(/^#/, ''),
          ts,
          text,
        }
      });
      return result.data || result;
    }
  });
}

/**
 * Get a specific message
 */
export async function getSlackMessage(channelId: string, ts: string): Promise<SlackMessage | null> {
  const result = await safeAction("slack-get-message", { channelId, ts }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getSlackConnectedAccountId();
    const entityId = getComposioUserId();
    
    // Slack doesn't have a direct "get message" API, so we list messages and find it
    try {
      const listResult = await composio.executeAction({
        connectedAccountId,
        action: "SLACK_LIST_MESSAGES",
        params: {
          channel: channelId.replace(/^#/, ''),
          latest: ts,
          inclusive: true,
          limit: 1,
        }
      });
      
      const messages = (listResult as any)?.data?.messages || (Array.isArray(listResult?.data) ? listResult.data : []);
      return messages.find((m: any) => m.ts === ts) || null;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const listResult = await composio.executeAction({
        entityId,
        action: "SLACK_LIST_MESSAGES",
        params: {
          channel: channelId.replace(/^#/, ''),
          latest: ts,
          inclusive: true,
          limit: 1,
        }
      });
      
      const messages = (listResult as any)?.data?.messages || (Array.isArray(listResult?.data) ? listResult.data : []);
      return messages.find((m: any) => m.ts === ts) || null;
    }
  });
  
  return (result.result as SlackMessage | null) || null;
}
