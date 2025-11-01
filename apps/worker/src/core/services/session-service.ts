/**
 * Session Service - Business logic layer for session management
 */

import { pluginRegistry } from '../plugin-registry';
import { IDataPlugin, Session, Message } from '../interfaces/data-plugin.interface';
import { log } from '../../log';

export class SessionService {
  private async getDataPlugin(): Promise<IDataPlugin> {
    return await pluginRegistry.get<IDataPlugin>('data');
  }

  async createSession(channel: string, persona: string, userName: string): Promise<Session | null> {
    try {
      const plugin = await this.getDataPlugin();
      const result = await plugin.createSession({
        channel,
        persona,
        userName,
        startedAt: Date.now(),
      });

      if (result.ok && result.data) {
        log.info('Session created', {
          sessionId: result.data.sessionId,
          channel,
          persona,
        });
        return result.data;
      }

      return null;
    } catch (error) {
      log.error('Create session failed', error);
      return null;
    }
  }

  async endSession(sessionId: string): Promise<boolean> {
    try {
      const plugin = await this.getDataPlugin();
      const result = await plugin.endSession(sessionId);

      if (result.ok) {
        log.info('Session ended', { sessionId });
        return true;
      }

      return false;
    } catch (error) {
      log.error('End session failed', error);
      return false;
    }
  }

  async appendMessage(
    sessionId: string,
    from: string,
    text: string,
    sourceRefs?: Array<{ type: string; id: string; title?: string; url?: string }>,
    latencyMs?: number
  ): Promise<boolean> {
    try {
      const plugin = await this.getDataPlugin();
      const result = await plugin.appendMessage({
        sessionId,
        from,
        text,
        sourceRefs: sourceRefs || [],
        latencyMs: latencyMs || 0,
      });

      return result.ok || false;
    } catch (error) {
      log.warn('Append message failed (non-fatal)', error);
      return false;
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    try {
      const plugin = await this.getDataPlugin();
      const result = await plugin.getMessagesBySession(sessionId);

      if (result.ok && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      log.error('Get messages failed', error);
      return [];
    }
  }

  async listSessions(): Promise<Session[]> {
    try {
      const plugin = await this.getDataPlugin();
      const result = await plugin.listSessions();

      if (result.ok && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      log.error('List sessions failed', error);
      return [];
    }
  }
}

export const sessionService = new SessionService();

