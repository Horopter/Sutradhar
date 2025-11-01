/**
 * Communication Domain Models
 * Unified models for messaging, channels, and notifications
 */

export type Platform = 'slack' | 'github' | 'email' | 'calendar';

export interface Channel {
  id: string;
  platform: Platform;
  name: string;
  type: 'public' | 'private' | 'direct' | 'issue' | 'thread';
  metadata?: {
    url?: string;
    workspace?: string;
    members?: number;
    [key: string]: any;
  };
}

export interface MessageInput {
  channelId: string;
  platform: Platform;
  text: string;
  threadId?: string;
  metadata?: {
    attachments?: Array<{ type: string; url: string; name?: string }>;
    mentions?: string[];
    [key: string]: any;
  };
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  platform: Platform;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: number;
  threadId?: string;
  metadata?: Record<string, any>;
}

export interface MessageResult {
  success: boolean;
  messageId: string;
  channelId: string;
  platform: Platform;
  threadId?: string;
  timestamp: number;
  error?: string;
}

export interface MessageListOptions {
  limit?: number;
  before?: number;
  after?: number;
  threadId?: string;
}

