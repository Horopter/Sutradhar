/**
 * Real Email Plugin - Wraps existing AgentMail adapter
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import { IEmailPlugin, SendEmailPayload, SendEmailResponse } from '../interfaces/email-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { sendEmail, resolveInboxId } from '../../agentmail/adapter';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class EmailRealPlugin extends BaseMockPlugin implements IEmailPlugin {
  readonly metadata: PluginMetadata = {
    name: 'email-real',
    version: '1.0.0',
    description: 'Real AgentMail email provider',
    capabilities: ['send', 'resolve-inbox', 'validate-inbox'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('email-agentmail', {
    failureThreshold: 5,
    resetTimeout: 30000,
  });

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async sendEmail(payload: SendEmailPayload): Promise<PluginResult<SendEmailResponse>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        // Normalize 'to' field - sendEmail expects string, not array
        const toAddress = Array.isArray(payload.to) ? payload.to[0] : payload.to;
        
        const agentmailPayload = {
          to: toAddress,
          subject: payload.subject,
          text: payload.text,
          cc: payload.cc,
          bcc: payload.bcc,
          headers: payload.headers,
        };

        return await sendEmail(agentmailPayload);
      });

      return {
        ok: result.ok,
        mocked: result.mocked || false,
        data: {
          threadId: result.threadId,
          messageId: result.messageId,
        },
      };
    } catch (error) {
      log.error('Email send failed', error);
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async resolveInboxId(): Promise<PluginResult<string>> {
    try {
      const inboxId = await this.circuitBreaker.execute(() => resolveInboxId());
      return {
        ok: true,
        mocked: false,
        data: inboxId,
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async validateInbox(inboxId: string): Promise<PluginResult<boolean>> {
    try {
      const resolved = await this.resolveInboxId();
      return {
        ok: true,
        mocked: false,
        data: resolved.data === inboxId,
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        data: false,
      };
    }
  }
}

