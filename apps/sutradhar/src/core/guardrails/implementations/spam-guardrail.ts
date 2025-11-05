/**
 * Spam Guardrail - Detects repetitive or spam-like queries
 * Production-ready with automatic cleanup and memory management
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';
import { cache } from '../../cache';
import { log } from '../../../log';

export class SpamGuardrail implements IGuardrail {
  name = 'spam';
  category = 'spam' as const;
  description = 'Detects repetitive or spam-like queries';

  // In-memory store for recent queries (fallback if cache unavailable)
  // In production with Redis, this will be rarely used
  private recentQueries: Map<string, Array<{ query: string; timestamp: number }>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Start cleanup interval for in-memory store
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Clean up stale entries every 5 minutes
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 5 * 60 * 1000);
  }

  private cleanupMemory(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [sessionId, queries] of this.recentQueries.entries()) {
      const filtered = queries.filter(q => now - q.timestamp < maxAge);
      if (filtered.length === 0) {
        this.recentQueries.delete(sessionId);
      } else {
        this.recentQueries.set(sessionId, filtered);
      }
    }

    // Limit total sessions to prevent memory bloat
    if (this.recentQueries.size > 10000) {
      // Remove least recently used sessions
      const entries = Array.from(this.recentQueries.entries())
        .sort((a, b) => {
          const aLatest = Math.max(...a[1].map(q => q.timestamp));
          const bLatest = Math.max(...b[1].map(q => q.timestamp));
          return aLatest - bLatest;
        });
      
      const toKeep = entries.slice(-5000);
      this.recentQueries = new Map(toKeep);
      log.warn('Spam guardrail: Cleaned up stale sessions to prevent memory bloat');
    }
  }

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const query = context.query.trim();
    
    // Early return for disabled spam check
    if (config?.enabled === false) {
      return { allowed: true, category: 'spam' };
    }

    const queryLower = query.toLowerCase();
    const sessionId = context.sessionId || 'anonymous';
    const maxRepeats = (config?.maxRepeats as number) ?? 3;
    const timeWindow = (config?.timeWindowMs as number) ?? 60000; // 1 minute default
    const minLength = (config?.minLength as number) ?? 10;

    // Check for very short queries that might be spam
    if (query.length < minLength && query.split(/\s+/).length < 3) {
      return {
        allowed: false,
        reason: config?.spamMessage || 'Please provide a more detailed question.',
        category: 'spam',
        severity: 'low',
      };
    }

    // Check for repetitive characters (e.g., "aaaaaa", "test test test")
    const repetitivePattern = /(.)\1{4,}/;
    if (repetitivePattern.test(query)) {
      return {
        allowed: false,
        reason: config?.spamMessage || 'Please provide a meaningful question.',
        category: 'spam',
        severity: 'low',
      };
    }

    // Try to use cache/Redis for distributed tracking
    const cacheKey = `spam:${sessionId}:${this.hashQuery(queryLower)}`;
    
    try {
      // Check cache for recent query count
      const cached = await cache.get<number>(cacheKey);
      if (cached !== null && cached >= maxRepeats) {
        return {
          allowed: false,
          reason: config?.spamMessage || 'You\'ve asked this question multiple times. Please wait a moment before trying again.',
          category: 'spam',
          severity: 'medium',
        };
      }

      // Increment counter in cache
      const newCount = (cached || 0) + 1;
      await cache.set(cacheKey, newCount, Math.ceil(timeWindow / 1000));
      
      if (newCount >= maxRepeats) {
        return {
          allowed: false,
          reason: config?.spamMessage || 'You\'ve asked this question multiple times. Please wait a moment before trying again.',
          category: 'spam',
          severity: 'medium',
        };
      }
    } catch (error) {
      // Fallback to in-memory if cache fails
      log.warn('Spam guardrail cache failed, using in-memory fallback', error);
      
      const now = Date.now();
      const sessionQueries = this.recentQueries.get(sessionId) || [];
      const recentQueries = sessionQueries.filter(q => now - q.timestamp < timeWindow);
      const repeatCount = recentQueries.filter(q => q.query === queryLower).length;
      
      if (repeatCount >= maxRepeats) {
        return {
          allowed: false,
          reason: config?.spamMessage || 'You\'ve asked this question multiple times. Please wait a moment before trying again.',
          category: 'spam',
          severity: 'medium',
        };
      }

      recentQueries.push({ query: queryLower, timestamp: now });
      this.recentQueries.set(sessionId, recentQueries);
    }

    // Helper for hashing queries

    return { allowed: true, category: 'spam' };
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.recentQueries.clear();
  }
}

