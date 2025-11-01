/**
 * Email Provider Plugin Interface
 */

import { IPlugin, PluginResult } from '../types';

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  text: string;
  cc?: string[];
  bcc?: string[];
  headers?: Record<string, string>;
  replyTo?: string;
}

export interface SendEmailResponse {
  threadId: string;
  messageId: string;
  draftId?: string;
}

export interface IEmailPlugin extends IPlugin {
  sendEmail(payload: SendEmailPayload): Promise<PluginResult<SendEmailResponse>>;
  resolveInboxId(): Promise<PluginResult<string>>;
  validateInbox(inboxId: string): Promise<PluginResult<boolean>>;
}

