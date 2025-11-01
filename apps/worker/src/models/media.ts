/**
 * Media Domain Models
 * Unified models for images, voice, and files
 */

export interface VoiceSession {
  sessionId: string;
  token: string;
  url: string;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface VoiceConfig {
  userId: string;
  roomName?: string;
  metadata?: Record<string, any>;
}

export interface ImageMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  url?: string;
  [key: string]: any;
}

