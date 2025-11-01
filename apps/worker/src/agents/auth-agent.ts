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
  async createGuest(context?: AgentContext): Promise<AgentResult<{ user: any; sessionId: string }>> {
    try {
      const result: any = await Convex.mutations('users:createGuest', {});
      
      if (!result || (result as any).skipped) {
        // Fallback guest user
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const user = {
          id: guestId,
          email: `guest_${guestId}@apex.local`,
          name: `Guest ${guestId.substring(6, 12)}`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          streak: 0,
          badges: []
        };
        
        return this.success({
          user,
          sessionId: `session_${guestId}`
        });
      }

      const sessionId = `session_${(result as any).userId}`;
      return this.success({
        user: (result as any).user,
        sessionId
      });
    } catch (error: any) {
      log.error('AuthAgent.createGuest failed', error);
      return this.error(error.message || 'Failed to create guest session');
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

