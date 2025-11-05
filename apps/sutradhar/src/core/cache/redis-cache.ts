/**
 * Redis Cache Implementation
 * For distributed caching in production (multi-instance deployments)
 */

import { ICache } from './types';
import { log } from '../../log';

export class RedisCache implements ICache {
  public readonly isRedis = true; // Flag to identify Redis cache
  private client: any;
  private connected: boolean = false;
  private readonly defaultTTL: number;
  private readonly namespace: string;
  private initPromise: Promise<void> | null = null;

  constructor(
    redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379',
    defaultTTL: number = 3600,
    namespace: string = 'sutradhar'
  ) {
    this.defaultTTL = defaultTTL;
    this.namespace = namespace;
    
    // Initialize client asynchronously
    this.initPromise = this.initClient(redisUrl);
  }

  private async initClient(redisUrl: string): Promise<void> {
    try {
      const redis = await import('redis');
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              log.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err: any) => {
        log.error('Redis client error', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        log.info('Redis client connected');
        this.connected = true;
      });

      this.client.on('disconnect', () => {
        log.warn('Redis client disconnected');
        this.connected = false;
      });

      // Connect in background (non-blocking)
      this.client.connect().catch((err: any) => {
        log.warn('Redis connection failed, will retry', err);
      });
    } catch (error: any) {
      log.error('Failed to initialize Redis client', error);
      this.connected = false;
      throw error;
    }
  }

  private key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    // Wait for initialization if still in progress
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
    
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(this.key(key));
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      log.error('Redis get error', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Wait for initialization if still in progress
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
    
    if (!this.connected || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const finalTTL = ttl || this.defaultTTL;
      await this.client.setEx(this.key(key), finalTTL, serialized);
    } catch (error) {
      log.error('Redis set error', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
    if (!this.connected || !this.client) return;

    try {
      await this.client.del(this.key(key));
    } catch (error) {
      log.error('Redis delete error', error);
    }
  }

  async clear(namespace?: string): Promise<void> {
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
    if (!this.connected || !this.client) return;

    try {
      const pattern = namespace 
        ? `${this.namespace}:${namespace}:*`
        : `${this.namespace}:*`;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      log.error('Redis clear error', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
    if (!this.connected || !this.client) return false;

    try {
      const result = await this.client.exists(this.key(key));
      return result === 1;
    } catch (error) {
      log.error('Redis has error', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

