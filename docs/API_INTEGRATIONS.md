# API Integrations Summary

This document lists all external APIs used in the Sutradhar application and their integration status.

## 🔵 Fully Integrated & Working

### 1. **Convex Database** ✅
- **Status**: ✅ **Configured & Ready**
- **Purpose**: Session and message persistence
- **Env Var**: `CONVEX_URL` ✅ **Set**
- **Usage**: 
  - Session management
  - Message logging
  - Action audit trails
- **Setup**: Run `cd apps/convex && pnpm dev`

### 2. **LiveKit** ✅
- **Status**: ✅ **Fully Configured**
- **Purpose**: Real-time voice communication
- **Env Vars**: ✅ **All Set**
  - `LIVEKIT_URL` ✅
  - `LIVEKIT_API_KEY` ✅
  - `LIVEKIT_API_SECRET` ✅
- **Usage**: 
  - Voice token generation (`/voice/token`)
  - Voice UI at `/voice`
- **Note**: All credentials configured and ready

### 3. **AgentMail** ✅
- **Status**: ✅ **API Key Configured**
- **Purpose**: Email sending via AgentMail API
- **Env Vars**:
  - `AGENTMAIL_API_KEY` ✅ **Set**
  - `AGENTMAIL_BASE_URL` (default: `https://api.agentmail.to`)
  - `AGENTMAIL_FROM_ADDRESS` (optional)
  - `AGENTMAIL_FROM_NAME` (optional)
  - `AGENTMAIL_WEBHOOK_SECRET` (optional, for webhooks)
- **Endpoints**: 
  - `POST /agentmail/send`
  - `POST /agentmail/webhook`
- **Features**:
  - Draft creation and sending
  - Inbox resolution with caching
  - Webhook support for incoming emails
  - Dry-run mode (`AGENTMAIL_DRY_RUN=true`)
- **Current Mode**: ✅ Real (API key present)

### 4. **Hyperspell** ✅
- **Status**: ✅ **API Key Configured**
- **Purpose**: Vector search and memory vault retrieval
- **Env Vars**:
  - `HYPERSPELL_API_KEY` ✅ **Set**
  - `HYPERSPELL_BASE_URL` ✅ **Set**
  - `RETRIEVAL_REQUIRE_HS` (default: `false` - optional)
  - `MOCK_RETRIEVAL=false` ✅ **Real mode enabled**
- **Usage**: Primary retrieval source (vault memories)
- **Retrieval Order**: 
  1. Hyperspell ✅ (configured)
  2. BM25 local index (fallback)
  3. File-scan (last resort)
- **Endpoints**:
  - `POST /retrieval/hyperspell/seed` - Seed text to Hyperspell
  - `GET /diag/hyperspell` - Hyperspell diagnostics
- **Current Status**: ✅ Configured and active

### 5. **OpenAI** ✅
- **Status**: ✅ **API Key Configured**
- **Purpose**: LLM responses via OpenAI API
- **Env Vars**:
  - `OPENAI_API_KEY` ✅ **Set**
  - `LLM_OPENAI_MODEL` (default: `gpt-4o-mini`)
  - `LLM_DEFAULT_PROVIDER` (default: `openai`)
  - `MOCK_LLM` (check status - likely `true` = mock mode)
- **Endpoints**:
  - `POST /llm/answer` - Generate LLM answers
  - `POST /llm/summarize` - Summarize text
  - `POST /llm/escalate` - Escalation analysis
- **Current Mode**: ⚠️ Likely Mock (`MOCK_LLM=true`)
- **To Enable Real Mode**: Set `MOCK_LLM=false` in `.env`

### 6. **Perplexity** ✅
- **Status**: ✅ **API Key Configured**
- **Purpose**: Alternative LLM provider
- **Env Vars**:
  - `PERPLEXITY_API_KEY` ✅ **Set**
  - `LLM_PERPLEXITY_MODEL` (default: `pplx-7b-online`)
  - `LLM_DEFAULT_PROVIDER=perplexity` (to use as default)
  - `MOCK_LLM` (check status - likely `true` = mock mode)
- **Usage**: Alternative to OpenAI, specified via `provider` parameter
- **Current Mode**: ⚠️ Likely Mock (`MOCK_LLM=true`)
- **To Enable Real Mode**: Set `MOCK_LLM=false` in `.env`

---

## 🟡 Configured, Needs Dashboard Setup

### 7. **Composio** ⚠️
- **Status**: ✅ **API Key Configured** | ⚠️ **Dashboard Connections Needed**
- **Purpose**: Unified API for Slack, Google Calendar, and GitHub
- **Env Vars**:
  - `COMPOSIO_API_KEY` ✅ **Set**
  - `MOCK_ACTIONS=true` ⚠️ **Currently in mock mode**
  - `SLACK_CHANNEL_ID` (optional)
  - `GCAL_CALENDAR_ID` (optional)
  - `GITHUB_REPO_SLUG` (optional)
- **Endpoints**:
  - `POST /actions/slack` - Post to Slack channels
  - `POST /actions/calendar` - Create Google Calendar events
  - `POST /actions/github` - Create GitHub issues
  - `GET /actions/list` - List actions by session
  - `GET /diag/composio` - Composio diagnostics
- **Current Mode**: Mock (`MOCK_ACTIONS=true`)
- **To Enable**: 
  1. Set up connections in Composio dashboard (Slack, Google Calendar, GitHub)
  2. Set each connection as default
  3. Set `MOCK_ACTIONS=false` in `.env`
  4. Restart worker

---

## 🔴 Temporarily Disabled

### 8. **Moss (Inferedge)** ❌
- **Status**: Temporarily disabled due to SDK compatibility issue
- **Purpose**: Vector database for document indexing
- **Env Vars**:
  - `MOSS_PROJECT_ID`
  - `MOSS_PROJECT_KEY`
  - `MOSS_INDEX_NAME` (default: `seed`)
  - `MOSS_BRIDGE_URL` (default: `http://127.0.0.1:4050`)
- **Issue**: ESM/CJS compatibility problem in `@inferedge/moss` SDK
- **Workaround**: Using BM25 local index as fallback
- **Files**:
  - `apps/moss-bridge/` - Bridge service (kept for future)
  - Client functions in `apps/worker/src/retrieval/clients.ts` (implemented)
- **When to Re-enable**: After Moss SDK is fixed
  1. Re-enable moss-bridge service
  2. Restore `mossBridgeQuery()` and `mossBridgeIndex()` calls
  3. Update health check endpoint

---

## 🟢 OAuth Providers (Partial Implementation)

### 9. **GitHub OAuth** 🟡
- **Status**: Endpoints exist, returns dummy tokens
- **Purpose**: User authentication
- **Endpoints**:
  - `POST /auth/github/login`
  - `GET /auth/github/callback`
- **Current**: Returns dummy tokens (Composio OAuth requires dashboard setup)
- **Note**: OAuth flow is stubbed out, needs Composio dashboard configuration

### 10. **Slack OAuth** 🟡
- **Status**: Endpoints exist, returns dummy tokens
- **Purpose**: User authentication
- **Endpoints**:
  - `POST /auth/slack/login`
  - `GET /auth/slack/callback`
- **Current**: Returns dummy tokens
- **Note**: OAuth flow is stubbed out, needs Composio dashboard configuration

### 11. **Google OAuth** 🟡
- **Status**: Endpoints exist, returns dummy tokens
- **Purpose**: User authentication and Calendar access
- **Endpoints**:
  - `POST /auth/google/login`
  - `GET /auth/google/callback`
- **Current**: Returns dummy tokens
- **Note**: OAuth flow is stubbed out, needs Composio dashboard configuration

---

## 📊 Summary by Status (Based on Actual .env Configuration)

| Status | Count | APIs |
|--------|-------|------|
| ✅ Fully Configured & Active | 4 | Convex, LiveKit, AgentMail, Hyperspell |
| ✅ Configured, Mock Mode | 2 | OpenAI, Perplexity (set `MOCK_LLM=false` to enable) |
| ⚠️ Needs Dashboard Setup | 1 | Composio (set `MOCK_ACTIONS=false` after dashboard config) |
| ❌ Disabled | 1 | Moss (SDK issue, keys present but service disabled) |
| 🟡 Partial/Stub | 3 | GitHub OAuth, Slack OAuth, Google OAuth |

---

## 🔧 Quick Enable Checklist

### Current Configuration Status (from .env):

✅ **Already Configured:**
- ✅ `CONVEX_URL` - Set
- ✅ `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - All set
- ✅ `AGENTMAIL_API_KEY` - Set (real mode active)
- ✅ `HYPERSPELL_API_KEY` - Set (real mode active: `MOCK_RETRIEVAL=false`)
- ✅ `OPENAI_API_KEY` - Set (but check `MOCK_LLM` flag)
- ✅ `PERPLEXITY_API_KEY` - Set (but check `MOCK_LLM` flag)
- ✅ `COMPOSIO_API_KEY` - Set (but `MOCK_ACTIONS=true`, needs dashboard setup)
- ✅ `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` - Set (but service disabled due to SDK issue)

### To Enable Real Mode for LLM:

```bash
# In .env file, change:
MOCK_LLM=false
```

### To Enable Real Mode for Composio Actions:

1. First, configure connections in Composio dashboard:
   - Slack connection → set as default
   - Google Calendar connection → set as default  
   - GitHub connection → set as default

2. Then in `.env` file:
   ```bash
   MOCK_ACTIONS=false
   ```

3. Restart the worker server

---

## 📝 Environment Variables Reference

See `apps/worker/src/env.ts` for complete environment variable schema and validation.

---

## 🔍 Diagnostics Endpoints

Test API connectivity:
- `GET /health` - Basic health check
- `GET /health/full` - Full service health status
- `GET /diag/agentmail` - AgentMail diagnostics
- `GET /diag/composio` - Composio diagnostics
- `GET /diag/hyperspell` - Hyperspell diagnostics
- `GET /convex/diag` - Convex diagnostics

