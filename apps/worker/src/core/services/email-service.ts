/**
 * Email Service - Business logic layer for email operations
 */

import { pluginRegistry } from '../plugin-registry';
import { IEmailPlugin } from '../interfaces/email-plugin.interface';
import { SendEmailPayload, SendEmailResponse } from '../interfaces/email-plugin.interface';
import { log } from '../../log';
import { cache } from '../cache';

export class EmailService {
  private async getPlugin(): Promise<IEmailPlugin> {
    return await pluginRegistry.get<IEmailPlugin>('email');
  }

  async sendEmail(payload: SendEmailPayload): Promise<{ ok: boolean; mocked?: boolean; data?: SendEmailResponse; error?: string }> {
    try {
      const plugin = await this.getPlugin();
      const result = await plugin.sendEmail(payload);

      if (result.ok && result.data) {
        log.info('Email sent', {
          to: payload.to,
          threadId: result.data.threadId,
          mocked: result.mocked,
        });
      }

      return {
        ok: result.ok,
        mocked: result.mocked,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      log.error('Email service error', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async resolveInboxId(useCache = true): Promise<string | null> {
    const cacheKey = 'email:inbox:id';

    if (useCache) {
      const cached = await cache.get<string>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const plugin = await this.getPlugin();
      const result = await plugin.resolveInboxId();

      if (result.ok && result.data) {
        // Cache for 1 hour
        await cache.set(cacheKey, result.data, 3600);
        return result.data;
      }

      return null;
    } catch (error) {
      log.error('Resolve inbox ID failed', error);
      return null;
    }
  }
}

export const emailService = new EmailService();

