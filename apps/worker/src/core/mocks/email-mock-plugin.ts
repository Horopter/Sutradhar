/**
 * Mock Email Plugin - Sophisticated mock that simulates real email behavior
 */

import { BaseMockPlugin } from './base-mock-plugin';
import { IEmailPlugin, SendEmailPayload, SendEmailResponse } from '../interfaces/email-plugin.interface';
import { PluginConfig, PluginMetadata, HealthStatus, PluginResult } from '../types';
import { log } from '../../log';

interface MockEmail {
  threadId: string;
  messageId: string;
  to: string;
  subject: string;
  text: string;
  sentAt: number;
}

export class EmailMockPlugin extends BaseMockPlugin implements IEmailPlugin {
  readonly metadata: PluginMetadata = {
    name: 'email-mock',
    version: '1.0.0',
    description: 'Mock email provider for development and testing',
    capabilities: ['send', 'resolve-inbox', 'validate-inbox'],
  };

  readonly config: PluginConfig;

  private inboxCache: Map<string, string> = new Map();
  private emailStore: MockEmail[] = [];

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async initialize(config: PluginConfig): Promise<void> {
    await super.initialize(config);
    // Initialize with default inbox if provided
    if (config.fromAddress) {
      const inboxId = this.generateId('inbox');
      this.inboxCache.set(config.fromAddress, inboxId);
      log.info(`Mock inbox created for ${config.fromAddress}: ${inboxId}`);
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    const base = await super.healthCheck();
    return {
      ...base,
      details: {
        emailsSent: this.emailStore.length,
        inboxes: this.inboxCache.size,
      },
    };
  }

  async sendEmail(payload: SendEmailPayload): Promise<PluginResult<SendEmailResponse>> {
    await this.simulateLatency(50, 200);

    const threadId = this.generateId('th');
    const messageId = this.generateId('msg');

    // Store email for potential retrieval
    const mockEmail: MockEmail = {
      threadId,
      messageId,
      to: Array.isArray(payload.to) ? payload.to[0] : payload.to,
      subject: payload.subject,
      text: payload.text,
      sentAt: Date.now(),
    };
    this.emailStore.push(mockEmail);

    // Keep only last 1000 emails in memory
    if (this.emailStore.length > 1000) {
      this.emailStore.shift();
    }

    log.info('MOCK EMAIL SENT', {
      to: mockEmail.to,
      subject: mockEmail.subject,
      threadId,
      messageId,
    });

    return this.mockSuccess<SendEmailResponse>({
      threadId,
      messageId,
    }, {
      emailCount: this.emailStore.length,
    });
  }

  async resolveInboxId(): Promise<PluginResult<string>> {
    await this.simulateLatency(20, 80);

    const fromAddress = this.config.fromAddress;
    if (!fromAddress) {
      return this.mockError<string>('No from address configured');
    }

    // Return cached or create new
    if (this.inboxCache.has(fromAddress)) {
      return this.mockSuccess(this.inboxCache.get(fromAddress)!);
    }

    const inboxId = this.generateId('inbox');
    this.inboxCache.set(fromAddress, inboxId);
    
    return this.mockSuccess(inboxId);
  }

  async validateInbox(inboxId: string): Promise<PluginResult<boolean>> {
    await this.simulateLatency(10, 50);
    
    const isValid = Array.from(this.inboxCache.values()).includes(inboxId);
    return this.mockSuccess(isValid);
  }

  /**
   * Get mock emails (for testing/debugging)
   */
  getMockEmails(): MockEmail[] {
    return [...this.emailStore];
  }

  /**
   * Clear mock email store
   */
  clearMockEmails(): void {
    this.emailStore = [];
  }
}

