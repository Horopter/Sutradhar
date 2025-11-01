/**
 * LiveKit Agent Service
 * Server-side agent that processes audio streams from LiveKit rooms
 * 
 * Note: This is a simplified implementation. For full agent functionality,
 * consider using the @livekit/agents SDK as a separate process.
 */

import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { env } from '../env';
import { log } from '../log';
import { answerService } from '../core/services/answer-service';

const LIVEKIT_URL = env.LIVEKIT_URL;
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET;
const OPENAI_API_KEY = env.OPENAI_API_KEY;

/**
 * Create a token for an agent to join a room
 */
export async function createAgentToken(roomName: string, agentId: string = 'agent-ai'): Promise<string | null> {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    log.warn('LiveKit credentials not set');
    return null;
  }

  try {
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: agentId,
      name: 'AI Assistant',
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  } catch (error) {
    log.error('Failed to create agent token', error);
    return null;
  }
}

/**
 * Initialize LiveKit Room Service Client
 */
export function createRoomServiceClient(): RoomServiceClient | null {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    log.warn('LiveKit credentials not set');
    return null;
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    log.info('✅ LiveKit Room Service Client created');
    return roomService;
  } catch (error) {
    log.error('Failed to create Room Service Client', error);
    return null;
  }
}

/**
 * Process a transcribed message and return response
 * This is used by webhook handlers or other integrations
 */
export async function processVoiceMessage(
  roomName: string,
  participantId: string,
  transcript: string
): Promise<{ text: string; citations: any[] } | null> {
  const sessionId = `livekit-${roomName}-${participantId}`;

  try {
    log.info(`Processing voice message from ${participantId} in room ${roomName}: "${transcript}"`);

    const answerResult = await answerService.answerQuestion(sessionId, transcript);

    return {
      text: answerResult.finalText,
      citations: answerResult.citations,
    };
  } catch (error: any) {
    log.error(`Error processing voice message: ${error.message}`, error);
    return null;
  }
}

/**
 * Check if LiveKit is properly configured
 */
export function isLiveKitConfigured(): boolean {
  return !!(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}

/**
 * Check if OpenAI is configured (for STT/TTS)
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

