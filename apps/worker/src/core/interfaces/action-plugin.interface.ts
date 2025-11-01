/**
 * Action/Integration Provider Plugin Interface
 * Supports Slack, Calendar, GitHub, and extensible to other integrations
 */

import { IPlugin, PluginResult } from '../types';

export type ActionType = 'slack' | 'calendar' | 'github' | 'forum' | string;

export interface BaseActionPayload {
  sessionId?: string;
  [key: string]: any;
}

export interface SlackActionPayload extends BaseActionPayload {
  text: string;
  channelId?: string;
}

export interface CalendarActionPayload extends BaseActionPayload {
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  calendarId?: string;
}

export interface GitHubActionPayload extends BaseActionPayload {
  title: string;
  body?: string;
  repoSlug?: string;
}

export interface ForumActionPayload extends BaseActionPayload {
  url?: string;
  username?: string;
  password?: string;
  text: string;
}

export interface ActionResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

export interface IActionPlugin extends IPlugin {
  executeAction<T extends BaseActionPayload>(
    type: ActionType,
    payload: T
  ): Promise<PluginResult<ActionResponse>>;
  
  listSupportedActions(): ActionType[];
  validateAction(type: ActionType, payload: any): boolean;
}

