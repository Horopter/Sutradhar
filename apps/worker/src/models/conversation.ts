/**
 * Conversation Domain Models
 * Unified models for conversations, messages, and sessions
 */

export interface ConversationContext {
  sessionId?: string;
  userId?: string;
  channel?: ConversationChannel;
  persona?: string;
  metadata?: Record<string, any>;
}

export interface ConversationChannel {
  type: 'web' | 'voice' | 'slack' | 'email' | 'github' | 'calendar';
  id?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  from: { id: string; name: string; type: 'user' | 'bot' | 'system' };
  text: string;
  timestamp: number;
  sourceRefs?: Array<{ type: string; id: string; title?: string; url?: string }>;
  latencyMs?: number;
  // Legacy support
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  metadata?: {
    sourceRefs?: Array<{ type: string; id: string; title?: string; url?: string }>;
    latencyMs?: number;
    model?: string;
    provider?: string;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  sessionId: string;
  channel: ConversationChannel;
  persona: string;
  userName: string;
  startedAt: number;
  endedAt?: number;
  messageCount: number;
  metadata?: Record<string, any>;
}

export interface Answer {
  text: string;
  citations: Array<{
    source: string;
    text: string;
    url?: string;
    score?: number;
  }>;
  sessionId?: string;
  messageId?: string;
  latencyMs: number;
  blocked?: boolean;
  blockReason?: string;
  metadata?: {
    model?: string;
    provider?: string;
    retrievalUsed?: boolean;
    [key: string]: any;
  };
}

export interface ChatResponse {
  message: Message;
  answer?: Answer;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

