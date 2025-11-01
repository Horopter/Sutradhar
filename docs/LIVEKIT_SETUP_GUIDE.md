# LiveKit Voice Integration - API Setup Guide

## 🎯 Overview

Sutradhar API provides LiveKit voice integration endpoints for building voice-enabled applications.

## 📋 API Endpoints

### GET /api/v1/voice/token
Generate LiveKit access token for room connection.

**Query Parameters:**
- `room` (optional): Room name (default: auto-generated)

**Response:**
```json
{
  "token": "eyJhbGc...",
  "url": "wss://your-livekit-url",
  "room": "room-name"
}
```

### POST /webhooks/livekit/transcription
Webhook endpoint for LiveKit transcription events (configure in LiveKit dashboard).

## 📋 Step-by-Step Setup

### Step 1: Configure Environment

Set LiveKit credentials in `.env`:
```bash
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Step 2: Start the API Server

```bash
cd apps/worker
npm run dev
```
Server should start on `http://localhost:2198`

### Step 3: Test the API

**Get a Voice Token:**
```bash
curl "http://localhost:2198/api/v1/voice/token?room=test-room"
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "url": "wss://your-livekit-url",
  "room": "test-room"
}
```

Use this token in your client application to connect to LiveKit rooms.

## 🔧 Manual Testing (Without Webhook)

Since webhook requires public URL, you can test manually:

### Test 1: Get a Token
```bash
curl http://localhost:2198/voice/token?room=test-room
```

### Test 2: Simulate Transcription Webhook
```bash
curl -X POST http://localhost:2198/webhooks/livekit/transcription \
  -H "Content-Type: application/json" \
  -d '{
    "room": { "name": "test-room" },
    "participant": { "identity": "test-user" },
    "transcript": "What are the known issues?",
    "is_final": true
  }'
```

### Test 3: Direct Answer API
```bash
curl -X POST http://localhost:2198/api/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the known issues?",
    "sessionId": "test-session"
  }'
```

## 🎤 Using the Voice API

### Client Implementation

1. **Get Token:** Call `/api/v1/voice/token` to get access token
2. **Connect:** Use token with LiveKit client SDK to connect to room
3. **Publish Audio:** Publish local audio track to room
4. **Subscribe:** Subscribe to remote tracks for audio responses

### Example Client Code (JavaScript):

```javascript
// 1. Get token from API
const response = await fetch('http://localhost:2198/api/v1/voice/token?room=my-room');
const { token, url, room } = await response.json();

// 2. Connect to LiveKit room
import { Room } from 'livekit-client';
const room = new Room();
await room.connect(url, token);

// 3. Publish local audio
const audioTrack = await createLocalAudioTrack();
await room.localParticipant.publishTrack(audioTrack);

// 4. Subscribe to remote tracks
room.on('trackSubscribed', (track) => {
  // Handle remote audio
});
```

## 🚀 Webhook Configuration (Optional)

To enable automatic transcription processing, configure the webhook in LiveKit dashboard:

1. Go to [LiveKit Cloud Dashboard](https://cloud.livekit.io/)
2. Navigate to your project
3. Go to **Settings** → **Webhooks**
4. Add webhook URL: `https://your-domain.com/webhooks/livekit/transcription`
   - For local development, use a tunnel service (ngrok, localtunnel)
5. Enable **Transcription** events

The webhook will automatically process transcriptions and generate answers using the answer service.

## 🐛 Troubleshooting

### Token Generation Fails
- Check server is running: `curl http://localhost:2198/health`
- Verify LiveKit credentials in `.env`:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- Check server logs for errors

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check LiveKit dashboard webhook status
- Test webhook manually with curl (see below)

### Connection Issues (Client-Side)
- Verify token is valid (not expired)
- Check LiveKit URL matches your project
- Ensure proper permissions in token (canPublish, canSubscribe)

## 📊 Monitoring

### Check Server Health:
```bash
curl http://localhost:2198/health/full | jq '.services.livekit'
```

### Check Logs:
```bash
# LiveKit related logs
tail -f /tmp/sutradhar-server.log | grep -i livekit

# All voice/transcription logs
tail -f /tmp/sutradhar-server.log | grep -E "voice|transcription|LiveKit"
```

## 🎯 Quick Start Commands

```bash
# 1. Start API server
cd apps/worker && npm run dev

# 2. Get voice token
curl "http://localhost:2198/api/v1/voice/token?room=test-room"

# 3. Test webhook manually
curl -X POST http://localhost:2198/webhooks/livekit/transcription \
  -H "Content-Type: application/json" \
  -d '{
    "room": { "name": "test-room" },
    "participant": { "identity": "user1" },
    "transcript": "What are the known issues?",
    "is_final": true
  }'
```

## 📝 Next Steps

1. ✅ **API Ready** - Voice token endpoint is available
2. 🔧 **Build Client** - Implement LiveKit client in your application
3. 🔧 **Configure Webhook** - Set up LiveKit webhook in dashboard (optional)
4. 🚀 **Deploy** - Deploy API to production when ready

## 🆘 Need Help?

- Check `API_README.md` for general API documentation
- Check `apps/worker/src/voice/README.md` for technical implementation details
- Review server logs for debugging

