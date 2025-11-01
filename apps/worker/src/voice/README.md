# LiveKit Voice Integration

## Overview

This directory contains the LiveKit voice integration for real-time voice chat with the AI assistant.

## Current Implementation

### ✅ Completed

1. **Token Generation** (`token.ts`)
   - Generates JWT tokens for LiveKit room access
   - Endpoint: `GET /voice/token?room=<room_name>`

2. **Frontend Integration** (`apps/frontend/pages/voice.vue`)
   - Uses `livekit-client` SDK to connect to rooms
   - Publishes local audio track
   - Subscribes to remote audio tracks
   - UI for connecting/disconnecting

3. **Webhook Endpoint** (`server.ts`)
   - `POST /webhooks/livekit/transcription`
   - Receives transcriptions from LiveKit
   - Processes transcripts through answer service

4. **Agent Utilities** (`agent.ts`)
   - Helper functions for creating agent tokens
   - Room service client creation
   - Voice message processing

## Configuration

Required environment variables:
- `LIVEKIT_URL` - WebSocket URL (e.g., `wss://clankers-pepwgfn2.livekit.cloud`)
- `LIVEKIT_API_KEY` - API key for token generation
- `LIVEKIT_API_SECRET` - Secret for signing tokens
- `OPENAI_API_KEY` - For STT/TTS (optional but recommended)

## Usage

### Client-Side (Frontend)

1. Get a token:
   ```typescript
   const tokenResponse = await api.getVoiceToken()
   ```

2. Connect to room:
   ```typescript
   const room = new Room()
   await room.connect(tokenResponse.url, tokenResponse.token)
   ```

3. Publish audio:
   ```typescript
   const audioTrack = await createLocalAudioTrack()
   await room.localParticipant.publishTrack(audioTrack)
   ```

### Server-Side

The current implementation uses a webhook-based approach:
- LiveKit sends transcription webhooks to `/webhooks/livekit/transcription`
- The server processes transcripts and generates responses
- Responses can be sent back via TTS (requires additional setup)

## Full Agent Setup (Optional)

For full real-time agent functionality with automatic STT/TTS, you can set up a separate LiveKit agent process:

1. **Install agent dependencies:**
   ```bash
   npm install @livekit/agents @livekit/agents-plugin-openai
   ```

2. **Create agent script:**
   Create a separate process that:
   - Connects to LiveKit rooms as an agent participant
   - Listens to audio tracks
   - Uses OpenAI Whisper for STT
   - Processes transcripts through answer service
   - Uses OpenAI TTS for audio responses
   - Publishes audio tracks back to room

3. **Run agent:**
   ```bash
   node apps/worker/src/voice/agent-process.ts
   ```

## Webhook Configuration

To enable LiveKit webhooks:

1. Go to LiveKit Cloud Dashboard
2. Navigate to your project settings
3. Add webhook URL: `https://your-domain.com/webhooks/livekit/transcription`
4. Enable transcription events

## Testing

1. Start the server:
   ```bash
   cd apps/worker && npm run dev
   ```

2. Open frontend voice page:
   ```
   http://localhost:3000/voice
   ```

3. Click "Join Room"
4. Grant microphone permission
5. Hold "Hold to Talk" and speak
6. Check console logs for connection status

## Next Steps

- [ ] Set up full agent process for automatic STT/TTS
- [ ] Integrate OpenAI Whisper for transcription
- [ ] Integrate OpenAI TTS for audio responses
- [ ] Add audio playback controls
- [ ] Add visual feedback for audio levels
- [ ] Handle multiple participants
- [ ] Add room management features

