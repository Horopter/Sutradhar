/**
 * Auth Agent - Optimus Layer
 * Uses Sutradhar orchestrator via SutradharClient
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';
import crypto from 'crypto';

// For now, we'll use a simple approach - later this can use Convex via Sutradhar
// Magic link tokens (in-memory for demo, use Redis in production)
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

export class AuthAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('AuthAgent', 'Handles user authentication (guest, magic link, verification)', sutradharClient);
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
      
      // Use Sutradhar data-agent for user creation
      const result: any = await this.convexMutation('users:createGuest', {
        userId: guestId,
        sessionId
      }, context).catch(() => null);
      
      // Use result if successful, otherwise use fallback
      let userId = guestId;
      let user: any;
      
      if (result && result.userId && !(result as any).skipped) {
        userId = result.userId;
        user = result.user || {
          id: guestId,
          userId: guestId,
          email: undefined,
          name: `Guest User`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
      } else {
        user = {
          id: guestId,
          userId: guestId,
          email: undefined,
          name: `Guest User`,
          role: 'guest',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
      }
      
      return this.success({
        user,
        userId: guestId,
        sessionId,
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to create guest session');
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(email: string, context?: AgentContext): Promise<AgentResult<{ message: string }>> {
    try {
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 3600000; // 1 hour
      magicTokens.set(token, { email, expiresAt });

      // Use Sutradhar email agent to send email
      const emailResult = await this.executeViaSutradhar(
        'email-agent',
        'send',
        {
          to: email,
          subject: 'Masterbolt - Magic Link Login',
          text: `Click this link to login: http://localhost:3777/auth/verify?token=${token}`, // Hardcoded Masterbolt URL
        },
        context
      );

      if (!emailResult.success) {
        return this.error(emailResult.error || 'Failed to send magic link email');
      }

      return this.success({
        message: 'Magic link sent successfully',
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to send magic link');
    }
  }

  /**
   * Verify magic link token
   */
  async verifyToken(token: string, context?: AgentContext): Promise<AgentResult<{ user: any; userId: string; sessionId: string }>> {
    try {
      const tokenData = magicTokens.get(token);
      
      if (!tokenData) {
        return this.error('Invalid or expired token');
      }

      if (Date.now() > tokenData.expiresAt) {
        magicTokens.delete(token);
        return this.error('Token has expired');
      }

      // Clean up token
      magicTokens.delete(token);

      // Use Sutradhar data-agent for user creation/update
      const userId = `USER_${crypto.randomBytes(16).toString('hex')}`;
      const sessionId = `SESSION_${crypto.randomBytes(16).toString('hex')}`;
      
      const result: any = await this.convexMutation('users:createOrUpdate', {
        userId,
        email: tokenData.email,
        sessionId
      }, context).catch(() => null);
      
      const user = result?.user || {
        id: userId,
        userId,
        email: tokenData.email,
        name: tokenData.email.split('@')[0],
        role: 'user',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      return this.success({
        user,
        userId,
        sessionId,
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to verify token');
    }
  }
}

