/**
 * Data/Storage Plugin Interface
 * Abstracts database operations (Convex, PostgreSQL, MongoDB, etc.)
 */

import { IPlugin, PluginResult } from '../types';

export interface Session {
  sessionId: string;
  channel: string;
  persona: string;
  userName: string;
  startedAt: number;
  endedAt?: number;
}

export interface Message {
  sessionId: string;
  from: string;
  text: string;
  sourceRefs?: Array<{ type: string; id: string; title?: string; url?: string }>;
  latencyMs?: number;
  ts?: number;
}

export interface ActionLog {
  sessionId: string;
  type: string;
  status: string;
  payload?: any;
  result?: any;
  ts?: number;
}

export interface Escalation {
  sessionId: string;
  reason: string;
  severity: string;
  agentmailThreadId: string;
  status?: string;
  lastEmailAt?: number;
  createdAt?: number;
}

export interface IDataPlugin extends IPlugin {
  // Sessions
  createSession(session: Omit<Session, 'sessionId'>): Promise<PluginResult<Session>>;
  endSession(sessionId: string): Promise<PluginResult<void>>;
  listSessions(): Promise<PluginResult<Session[]>>;
  
  // Messages
  appendMessage(message: Omit<Message, 'ts'>): Promise<PluginResult<void>>;
  getMessagesBySession(sessionId: string): Promise<PluginResult<Message[]>>;
  
  // Actions
  logAction(action: Omit<ActionLog, 'ts'>): Promise<PluginResult<void>>;
  getActionsBySession(sessionId: string): Promise<PluginResult<ActionLog[]>>;
  
  // Escalations
  upsertEscalation(escalation: Omit<Escalation, 'createdAt'>): Promise<PluginResult<void>>;
}

