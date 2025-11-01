/**
 * Media Service
 * Unified interface for images, voice, and media operations
 * Abstracts Moss, LiveKit, and file operations
 */

import { mossImageService } from '../integrations/images/moss-image-service';
import { tokenRoute } from '../voice/token';
import { ImageSearchQuery, ImageSearchResults, ImageInput } from '../models/knowledge';
import { VoiceSession, VoiceConfig } from '../models/media';
import { log } from '../log';
import { logger } from '../core/logging/logger';
import { env } from '../env';

export class MediaService {
  /**
   * Search images by text query or image similarity
   */
  async searchImages(query: ImageSearchQuery): Promise<ImageSearchResults> {
    // Delegate to knowledge service
    const { knowledgeService } = await import('./knowledge-service');
    return knowledgeService.searchImages(query);
  }

  /**
   * Index an image for search
   */
  async indexImage(image: ImageInput | ImageInput[]): Promise<{ ok: boolean; indexed?: number; total?: number; error?: string }> {
    // Delegate to knowledge service
    const { knowledgeService } = await import('./knowledge-service');
    return knowledgeService.indexImage(image);
  }

  /**
   * Start a voice session
   */
  async startVoiceSession(config: VoiceConfig): Promise<VoiceSession> {
    const serviceLogger = logger.child({ service: 'media', operation: 'startVoiceSession' });
    
    try {
      // Generate token using existing voice token route logic
      // We'll need to extract the token generation logic
      const roomName = config.roomName || `room-${Date.now()}`;
      
      // Generate token (simplified - would need to import actual logic)
      const token = await this._generateVoiceToken(config.userId, roomName);
      
      return {
        sessionId: `${config.userId}-${Date.now()}`,
        token,
        url: env.LIVEKIT_URL || '',
        expiresAt: Date.now() + 3600000, // 1 hour
        metadata: {
          roomName,
          userId: config.userId,
        },
      };
    } catch (error: any) {
      serviceLogger.error('Start voice session failed', { error: error.message });
      throw new Error(`Failed to start voice session: ${error.message}`);
    }
  }

  /**
   * Generate a voice token for a session
   */
  async generateVoiceToken(sessionId: string, userId: string, roomName?: string): Promise<string> {
    const serviceLogger = logger.child({ service: 'media', operation: 'generateVoiceToken' });
    
    try {
      const room = roomName || `room-${sessionId}`;
      return await this._generateVoiceToken(userId, room);
    } catch (error: any) {
      serviceLogger.error('Generate voice token failed', { error: error.message });
      throw new Error(`Failed to generate voice token: ${error.message}`);
    }
  }

  /**
   * Private helper to generate voice token
   */
  private async _generateVoiceToken(userId: string, roomName: string): Promise<string> {
    // Import LiveKit token generation
    const { AccessToken } = await import('livekit-server-sdk');
    
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return await token.toJwt();
  }

  /**
   * Check if image search is available
   */
  isImageSearchAvailable(): boolean {
    return !!(env.MOSS_PROJECT_ID && env.MOSS_PROJECT_KEY);
  }

  /**
   * Check if voice is available
   */
  isVoiceAvailable(): boolean {
    return !!(env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.LIVEKIT_URL);
  }
}

export const mediaService = new MediaService();

