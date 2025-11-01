/**
 * Mock Data Plugin - In-memory data store for development/testing
 * Can be replaced with real database implementations
 */

import { BaseMockPlugin } from './base-mock-plugin';
import {
  IDataPlugin,
  Session,
  Message,
  ActionLog,
  Escalation,
} from '../interfaces/data-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { nanoid } from 'nanoid';
import { log } from '../../log';

export class DataMockPlugin extends BaseMockPlugin implements IDataPlugin {
  readonly metadata: PluginMetadata = {
    name: 'data-mock',
    version: '1.0.0',
    description: 'Mock data store with in-memory storage',
    capabilities: ['sessions', 'messages', 'actions', 'escalations'],
  };

  readonly config: PluginConfig;
  
  private sessions: Map<string, Session> = new Map();
  private messages: Map<string, Message[]> = new Map(); // sessionId -> messages[]
  private actions: Map<string, ActionLog[]> = new Map(); // sessionId -> actions[]
  private escalations: Map<string, Escalation> = new Map(); // sessionId -> escalation

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async createSession(session: Omit<Session, 'sessionId'>): Promise<PluginResult<Session>> {
    await this.simulateLatency(10, 50);

    const sessionId = `session_${nanoid(16)}`;
    const fullSession: Session = {
      ...session,
      sessionId,
      startedAt: session.startedAt || Date.now(),
    };

    this.sessions.set(sessionId, fullSession);
    this.messages.set(sessionId, []);
    this.actions.set(sessionId, []);

    log.info('MOCK SESSION CREATED', { sessionId });

    return this.mockSuccess(fullSession);
  }

  async endSession(sessionId: string): Promise<PluginResult<void>> {
    await this.simulateLatency(10, 30);

    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.mockError(`Session ${sessionId} not found`);
    }

    session.endedAt = Date.now();
    this.sessions.set(sessionId, session);

    log.info('MOCK SESSION ENDED', { sessionId });

    return this.mockSuccess(undefined);
  }

  async listSessions(): Promise<PluginResult<Session[]>> {
    await this.simulateLatency(20, 80);

    const sessions = Array.from(this.sessions.values());
    return this.mockSuccess(sessions);
  }

  async appendMessage(message: Omit<Message, 'ts'>): Promise<PluginResult<void>> {
    await this.simulateLatency(10, 40);

    const sessionMessages = this.messages.get(message.sessionId) || [];
    const fullMessage: Message = {
      ...message,
      ts: Date.now(),
    };

    sessionMessages.push(fullMessage);
    this.messages.set(message.sessionId, sessionMessages);

    return this.mockSuccess(undefined);
  }

  async getMessagesBySession(sessionId: string): Promise<PluginResult<Message[]>> {
    await this.simulateLatency(10, 50);

    const messages = this.messages.get(sessionId) || [];
    return this.mockSuccess(messages);
  }

  async logAction(action: Omit<ActionLog, 'ts'>): Promise<PluginResult<void>> {
    await this.simulateLatency(10, 40);

    const sessionActions = this.actions.get(action.sessionId) || [];
    const fullAction: ActionLog = {
      ...action,
      ts: Date.now(),
    };

    sessionActions.push(fullAction);
    this.actions.set(action.sessionId, sessionActions);

    return this.mockSuccess(undefined);
  }

  async getActionsBySession(sessionId: string): Promise<PluginResult<ActionLog[]>> {
    await this.simulateLatency(10, 50);

    const actions = this.actions.get(sessionId) || [];
    return this.mockSuccess(actions);
  }

  async upsertEscalation(escalation: Omit<Escalation, 'createdAt'>): Promise<PluginResult<void>> {
    await this.simulateLatency(10, 40);

    const existing = this.escalations.get(escalation.sessionId);
    const fullEscalation: Escalation = {
      ...escalation,
      createdAt: existing?.createdAt || Date.now(),
      lastEmailAt: Date.now(),
    };

    this.escalations.set(escalation.sessionId, fullEscalation);

    log.info('MOCK ESCALATION UPSERTED', {
      sessionId: escalation.sessionId,
      severity: escalation.severity,
    });

    return this.mockSuccess(undefined);
  }

  /**
   * Get statistics (for debugging/monitoring)
   */
  getStats(): {
    sessions: number;
    totalMessages: number;
    totalActions: number;
    escalations: number;
  } {
    let totalMessages = 0;
    let totalActions = 0;

    for (const messages of this.messages.values()) {
      totalMessages += messages.length;
    }

    for (const actions of this.actions.values()) {
      totalActions += actions.length;
    }

    return {
      sessions: this.sessions.size,
      totalMessages,
      totalActions,
      escalations: this.escalations.size,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.sessions.clear();
    this.messages.clear();
    this.actions.clear();
    this.escalations.clear();
  }
}

