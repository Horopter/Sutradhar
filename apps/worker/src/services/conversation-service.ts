/**
 * Conversation Service
 * Unified interface for all conversation and Q&A operations
 * Abstracts all LLM, retrieval, and session complexity
 */

import { answerService } from '../core/services/answer-service';
import { sessionService } from '../core/services/session-service';
import { llmService } from '../core/services/llm-service';
import { ConversationContext, Message, Conversation, Answer, ChatResponse } from '../models/conversation';
import { log } from '../log';
import { logger } from '../core/logging/logger';

export class ConversationService {
  /**
   * Start a new conversation session
   */
  async startConversation(payload: {
    channelType: 'web' | 'slack' | 'voice' | 'email' | 'github' | 'calendar';
    channelId?: string;
    channelName?: string;
    persona: string;
    userName: string;
  }): Promise<Conversation | null> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'startConversation' });
    
    try {
      const session = await sessionService.createSession(
        payload.channelType,
        payload.persona,
        payload.userName
      );

      if (!session) {
        serviceLogger.error('Failed to create session via data plugin');
        return null;
      }

      return {
        id: session.sessionId,
        sessionId: session.sessionId,
        channel: {
          type: payload.channelType,
          id: payload.channelId,
          name: payload.channelName,
        },
        persona: session.persona,
        userName: session.userName,
        startedAt: session.startedAt,
        messageCount: 0,
      };
    } catch (error: any) {
      serviceLogger.error('Failed to start conversation', { error: error.message });
      throw new Error(`Failed to start conversation: ${error.message}`);
    }
  }

  /**
   * End an existing conversation session
   */
  async endConversation(sessionId: string): Promise<boolean> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'endConversation' });
    
    try {
      const success = await sessionService.endSession(sessionId);
      if (!success) {
        serviceLogger.warn('Failed to end session via data plugin', { sessionId });
      }
      return success;
    } catch (error: any) {
      serviceLogger.error('Failed to end conversation', { error: error.message, sessionId });
      throw new Error(`Failed to end conversation: ${error.message}`);
    }
  }

  /**
   * Send a message in a conversation and get an AI response
   */
  async sendMessage(payload: {
    sessionId: string;
    from: { id: string; name: string; type: 'user' | 'bot' | 'system' };
    text: string;
    persona?: string;
  }): Promise<Message> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'sendMessage' });
    const t0 = Date.now();

    try {
      // Append user message
      await sessionService.appendMessage(
        payload.sessionId,
        payload.from.name,
        payload.text,
        []
      );

      // Get AI answer
      const answerResult = await answerService.answerQuestion(
        payload.sessionId,
        payload.text,
        payload.persona
      );

      const botMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sessionId: payload.sessionId,
        from: { id: 'bot', name: 'Sutradhar', type: 'bot' },
        text: answerResult.finalText,
        timestamp: Date.now(),
        sourceRefs: answerResult.citations.map(c => ({
          type: 'retrieval',
          id: c.source,
          title: c.text.substring(0, 50),
          url: c.url,
        })),
        latencyMs: answerResult.latencyMs,
      };

      // Append bot message
      await sessionService.appendMessage(
        payload.sessionId,
        botMessage.from.name,
        botMessage.text,
        botMessage.sourceRefs,
        botMessage.latencyMs
      );

      serviceLogger.info('Message sent and response received', {
        sessionId: payload.sessionId,
        latencyMs: Date.now() - t0,
      });

      return botMessage;
    } catch (error: any) {
      serviceLogger.error('Failed to send message or get response', { error: error.message, sessionId: payload.sessionId });
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get all messages for a given conversation session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'getMessages' });
    
    try {
      const coreMessages = await sessionService.getMessages(sessionId);
      return coreMessages.map((msg: any) => ({
        id: msg.id || msg._id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sessionId: msg.sessionId || sessionId,
        from: { 
          id: msg.from || 'user', 
          name: (msg.from === 'bot' || msg.from === 'assistant') ? 'Sutradhar' : (msg.from || 'User'), 
          type: (msg.from === 'bot' || msg.from === 'assistant') ? 'bot' as const : 'user' as const
        },
        text: msg.text || '',
        timestamp: typeof msg.ts === 'number' ? msg.ts : (typeof msg.ts === 'string' ? parseFloat(msg.ts) * 1000 : Date.now()),
        sourceRefs: msg.sourceRefs || [],
        latencyMs: msg.latencyMs || 0,
        // Legacy support
        role: (msg.from === 'bot' || msg.from === 'assistant') ? 'assistant' as const : 'user' as const,
        content: msg.text || '',
      }));
    } catch (error: any) {
      serviceLogger.error('Failed to retrieve messages', { error: error.message, sessionId });
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }

  /**
   * Ask a question and get an answer
   */
  async ask(question: string, context?: ConversationContext): Promise<Answer> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'ask' });
    
    try {
      const sessionId = context?.sessionId || await this._ensureSession(context);
      
      // Record user message
      if (sessionId) {
        await sessionService.appendMessage(
          sessionId,
          'user',
          question,
          [],
          0
        );
      }

      // Get answer using answer service (includes retrieval + LLM)
      const result = await answerService.answerQuestion(
        sessionId || 'anonymous',
        question,
        context?.persona
      );

      // Record assistant response
      if (sessionId && result.finalText) {
        // Convert citations from { source, text, url, score } to { type, id, title, url }
        const sourceRefs = (result.citations || []).map((cit: any) => ({
          type: 'retrieval',
          id: cit.source || 'unknown',
          title: cit.text?.substring(0, 100) || cit.source,
          url: cit.url,
        }));
        
        await sessionService.appendMessage(
          sessionId,
          'assistant',
          result.finalText,
          sourceRefs,
          result.latencyMs
        ).catch(() => {
          // Non-fatal if message recording fails
        });
      }

      // Convert to unified Answer model
      return {
        text: result.finalText,
        citations: result.citations || [],
        sessionId,
        latencyMs: result.latencyMs,
        blocked: result.blocked,
        blockReason: result.blockReason,
        metadata: {
          retrievalUsed: result.citations.length > 0,
        },
      };
    } catch (error: any) {
      serviceLogger.error('Ask question failed', { error: error.message, question });
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * Send a chat message and get response
   */
  async chat(message: string, sessionId: string, context?: ConversationContext): Promise<ChatResponse> {
    const serviceLogger = logger.child({ service: 'conversation', operation: 'chat' });
    
    try {
      // Ensure session exists
      const validSessionId = await this._ensureSession({ ...context, sessionId });

      // Record user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        sessionId: validSessionId,
        from: { id: 'user', name: 'User', type: 'user' },
        text: message,
        timestamp: Date.now(),
        // Legacy support
        role: 'user',
        content: message,
      };

      await sessionService.appendMessage(
        validSessionId,
        'user',
        message,
        [],
        0
      );

      // Get answer
      const answer = await this.ask(message, { ...context, sessionId: validSessionId });

      // Convert citations from { source, text, url, score } to { type, id, title, url }
      const sourceRefs = (answer.citations || []).map((cit: any) => ({
        type: 'retrieval',
        id: cit.source || 'unknown',
        title: cit.text?.substring(0, 100) || cit.source,
        url: cit.url,
      }));

      // Record assistant response
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        sessionId: validSessionId,
        from: { id: 'bot', name: 'Sutradhar', type: 'bot' },
        text: answer.text,
        timestamp: Date.now(),
        sourceRefs,
        latencyMs: answer.latencyMs,
        // Legacy support
        role: 'assistant',
        content: answer.text,
      };

      await sessionService.appendMessage(
        validSessionId,
        'assistant',
        answer.text,
        sourceRefs,
        answer.latencyMs
      );

      return {
        message: assistantMessage,
        answer,
      };
    } catch (error: any) {
      serviceLogger.error('Chat failed', { error: error.message, sessionId });
      throw new Error(`Failed to process chat: ${error.message}`);
    }
  }

  /**
   * Get conversation details
   */
  async getConversation(sessionId: string): Promise<Conversation | null> {
    try {
      // Get session from session service
      const messages = await sessionService.getMessages(sessionId);
      
      if (messages.length === 0) {
        return null;
      }

      // Get session details from session service
      const sessions = await sessionService.listSessions();
      const session = sessions.find((s: any) => s.sessionId === sessionId);
      
      // Extract timestamp from first message (Message interface has ts field)
      const firstMsgTs = messages[0]?.ts || (messages[0] as any)?.timestamp || Date.now();
      
      return {
        id: sessionId,
        sessionId,
        channel: { 
          type: (session?.channel === 'web' ? 'web' : 
                 session?.channel === 'slack' ? 'slack' :
                 session?.channel === 'voice' ? 'voice' :
                 session?.channel === 'email' ? 'email' :
                 session?.channel === 'github' ? 'github' : 'web') as any
        },
        persona: session?.persona || 'default',
        userName: session?.userName || 'User',
        startedAt: session?.startedAt || firstMsgTs,
        endedAt: session?.endedAt,
        messageCount: messages.length,
      };
    } catch (error: any) {
      log.error('Get conversation failed', { error: error.message, sessionId });
      return null;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    try {
      const messages = await this.getMessages(sessionId);
      
      // Return with legacy format support
      return messages.slice(0, limit || messages.length);
    } catch (error: any) {
      log.error('Get history failed', { error: error.message, sessionId });
      return [];
    }
  }

  /**
   * Start a new conversation session
   */
  async startSession(channel: ConversationContext['channel'], persona?: string, userName?: string): Promise<string> {
    try {
      const channelType = channel?.type || 'web';
      const session = await sessionService.createSession(
        channelType,
        persona || 'default',
        userName || 'User'
      );
      
      return session?.sessionId || '';
    } catch (error: any) {
      log.error('Start session failed', { error: error.message });
      throw new Error(`Failed to start session: ${error.message}`);
    }
  }

  /**
   * End a conversation session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      await sessionService.endSession(sessionId);
    } catch (error: any) {
      log.error('End session failed', { error: error.message, sessionId });
      throw new Error(`Failed to end session: ${error.message}`);
    }
  }

  /**
   * Ensure a session exists, create if needed
   */
  private async _ensureSession(context?: ConversationContext): Promise<string> {
    if (context?.sessionId) {
      return context.sessionId;
    }

    // Create new session
    const session = await sessionService.createSession(
      context?.channel?.type || 'web',
      context?.persona || 'default',
      'User'
    );

    return session?.sessionId || 'anonymous';
  }
}

export const conversationService = new ConversationService();

