/**
 * Data Plugin - Convex database provider
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import {
  IDataPlugin,
  Session,
  Message,
  ActionLog,
  Escalation,
} from '../interfaces/data-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { Convex } from '../../convexClient';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class ConvexPlugin extends BaseMockPlugin implements IDataPlugin {
  readonly metadata: PluginMetadata = {
    name: 'convex',
    version: '1.0.0',
    description: 'Convex database provider',
    capabilities: ['sessions', 'messages', 'actions', 'escalations'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('data-convex', {
    failureThreshold: 5,
    resetTimeout: 30000,
  });

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async createSession(session: Omit<Session, 'sessionId'>): Promise<PluginResult<Session>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await Convex.sessions.start({
          channel: session.channel,
          persona: session.persona,
          userName: session.userName,
        });
      }) as any;

      if (result.ok === false && result.skipped) {
        throw new Error('Convex not available');
      }

      // Convex returns the session ID, construct full session
      const fullSession: Session = {
        ...session,
        sessionId: result.sessionId || result,
        startedAt: session.startedAt || Date.now(),
      };

      return {
        ok: true,
        mocked: false,
        data: fullSession,
      };
    } catch (error) {
      log.error('Create session failed', error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async endSession(sessionId: string): Promise<PluginResult<void>> {
    try {
      const result = await this.circuitBreaker.execute(() => 
        Convex.sessions.end({ sessionId })
      ) as any;

      if (result.ok === false && result.skipped) {
        throw new Error('Convex not available');
      }

      return {
        ok: true,
        mocked: false,
        data: undefined,
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async listSessions(): Promise<PluginResult<Session[]>> {
    try {
      const result = await this.circuitBreaker.execute(() => 
        Convex.sessions.list()
      ) as any;

      if (result.ok === false && result.skipped) {
        throw new Error('Convex not available');
      }

      return {
        ok: true,
        mocked: false,
        data: result || [],
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async appendMessage(message: Omit<Message, 'ts'>): Promise<PluginResult<void>> {
    try {
      await this.circuitBreaker.execute(() => 
        Convex.messages.append({
          sessionId: message.sessionId,
          from: message.from,
          text: message.text,
          sourceRefs: message.sourceRefs || [],
          latencyMs: message.latencyMs || 0,
        })
      );

      return {
        ok: true,
        mocked: false,
        data: undefined,
      };
    } catch (error) {
      // Non-fatal - log but don't fail
      log.warn('Append message failed (non-fatal)', error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getMessagesBySession(sessionId: string): Promise<PluginResult<Message[]>> {
    try {
      const result = await this.circuitBreaker.execute(() => 
        Convex.messages.bySession({ sessionId })
      ) as any;

      if (result.ok === false && result.skipped) {
        throw new Error('Convex not available');
      }

      return {
        ok: true,
        mocked: false,
        data: result || [],
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async logAction(action: Omit<ActionLog, 'ts'>): Promise<PluginResult<void>> {
    try {
      await this.circuitBreaker.execute(() => 
        Convex.actions.log({
          sessionId: action.sessionId,
          type: action.type,
          status: action.status,
          payload: action.payload,
          result: action.result,
        })
      );

      return {
        ok: true,
        mocked: false,
        data: undefined,
      };
    } catch (error) {
      log.warn('Log action failed (non-fatal)', error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getActionsBySession(sessionId: string): Promise<PluginResult<ActionLog[]>> {
    try {
      const result = await this.circuitBreaker.execute(() => 
        Convex.actions.listBySession({ sessionId })
      ) as any;

      if (result.ok === false && result.skipped) {
        throw new Error('Convex not available');
      }

      return {
        ok: true,
        mocked: false,
        data: result || [],
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async upsertEscalation(escalation: Omit<Escalation, 'createdAt'>): Promise<PluginResult<void>> {
    try {
      await this.circuitBreaker.execute(() => 
        Convex.escalations.upsert({
          sessionId: escalation.sessionId,
          reason: escalation.reason,
          severity: escalation.severity,
          agentmailThreadId: escalation.agentmailThreadId,
          status: escalation.status,
        })
      );

      return {
        ok: true,
        mocked: false,
        data: undefined,
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

