/**
 * Auth Agent
 * Single responsibility: Handle user authentication (guest, magic link, verification)
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { emailService } from '../core/services/email-service';
import { log } from '../log';
import crypto from 'crypto';
import { env } from '../env';

// Magic link tokens (in-memory for demo, use Redis in production)
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

export class AuthAgent extends BaseAgent {
  constructor() {
    super('AuthAgent', 'Handles user authentication (guest, magic link, verification)');
  }

  /**
   * Create a guest user session
   */
  async createGuest(context?: AgentContext): Promise<AgentResult<{ user: any; userId: string; sessionId: string }>> {
    try {
      // Generate GUEST_<NONCE> format using crypto for secure nonce
      const nonce = crypto.randomBytes(16).toString('hex');
      const guestId = `GUEST_${nonce}`;
      const sessionId = `GUEST_${nonce}`;
      
      // Try to create in Convex if available
      const result: any = await Convex.mutations('users:createGuest', {
        userId: guestId,
        sessionId
      }).catch(() => null);
      
      // Use result if successful, otherwise use fallback
      let userId = guestId;
      let user: any;
      
      if (result && result.userId && !(result as any).skipped) {
        userId = result.userId;
        user = result.user || {
          id: userId,
          userId: userId,
          email: undefined,
          name: `Guest User`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          streak: 0,
          badges: []
        };
      } else {
        // Fallback guest user with GUEST_<NONCE> format
        user = {
          id: guestId,
          userId: guestId,
          email: undefined,
          name: `Guest User`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          streak: 0,
          badges: []
        };
      }
      
      return this.success({
        user,
        userId,
        sessionId
      });
    } catch (error: any) {
      log.error('AuthAgent.createGuest failed', error);
      // Even on error, create a fallback guest session
      const nonce = crypto.randomBytes(16).toString('hex');
      const guestId = `GUEST_${nonce}`;
      const sessionId = `GUEST_${nonce}`;
      
      return this.success({
        user: {
          id: guestId,
          userId: guestId,
          email: undefined,
          name: `Guest User`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          streak: 0,
          badges: []
        },
        userId: guestId,
        sessionId
      });
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(email: string, context?: AgentContext): Promise<AgentResult<{ mocked: boolean }>> {
    try {
      if (!email || !email.includes('@')) {
        return this.error('Invalid email address');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 3600000; // 1 hour
      
      magicTokens.set(token, { email, expiresAt });
      
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
      const magicLink = `${frontendUrl}/login?token=${token}`;
      
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: 'Apex Academy Magic Link',
        text: `Click this link to login: ${magicLink}\n\nThis link expires in 1 hour.`
      });
      
      return this.success({
        mocked: emailResult.mocked || false
      }, {
        emailSent: true,
        dryRun: emailResult.mocked
      });
    } catch (error: any) {
      log.error('AuthAgent.sendMagicLink failed', error);
      return this.error(error.message || 'Failed to send magic link');
    }
  }

  /**
   * Verify magic link token
   */
  async verifyToken(token: string, context?: AgentContext): Promise<AgentResult<{ user: any; sessionId: string }>> {
    try {
      const tokenData = magicTokens.get(token);
      
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        magicTokens.delete(token);
        return this.error('Invalid or expired token');
      }
      
      magicTokens.delete(token);
      
      const result: any = await Convex.mutations('users:createOrGet', {
        email: tokenData.email
      });

      if (!result || (result as any).skipped) {
        return this.error('Failed to create user session');
      }
      
      const sessionId = `session_${(result as any).userId}`;
      return this.success({
        user: (result as any).user,
        sessionId
      });
    } catch (error: any) {
      log.error('AuthAgent.verifyToken failed', error);
      return this.error(error.message || 'Failed to verify token');
    }
  }
}

