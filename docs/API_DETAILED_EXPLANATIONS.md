# Detailed API Explanations

This document provides comprehensive explanations of what each API/service does in your Sutradhar project and how they work together.

---

## 1. 🔍 Hyperspell

### What It Is
**Hyperspell** is a vector search and memory vault service that provides semantic search capabilities. It's a managed service for storing and retrieving documents using vector embeddings.

### What It Does

#### Core Functionality:
- **Vector Storage**: Stores your documents (text) as high-dimensional vectors (embeddings) in a "vault"
- **Semantic Search**: Searches documents by meaning, not just keywords (finds related concepts)
- **Memory Vault**: Maintains a persistent collection of indexed documents that can be searched

#### In Your Project:

1. **Indexing Documents** (`hyperspellSeedText`)
   ```typescript
   // Adds text to Hyperspell's vault/collection
   await hs.memories.add({ text: "Your document content", collection: "demo" })
   ```
   - Takes raw text from your `.md` files
   - Converts it into vector embeddings
   - Stores in a collection (default: "demo")
   - Makes it searchable later

2. **Searching Documents** (`hyperspellSearch`)
   ```typescript
   // Searches the vault for relevant content
   await hs.memories.search({
     query: "What is photosynthesis?",
     sources: ["vault"],
     options: { max_results: 5 }
   })
   ```
   - Takes a natural language query
   - Finds semantically similar documents
   - Returns top results with relevance scores
   - Much better than keyword search (understands context)

#### How It Works:
1. **Embedding**: Converts text → numerical vectors that capture meaning
2. **Similarity Matching**: Compares query vector to document vectors
3. **Ranking**: Returns most relevant documents by semantic similarity

#### Retrieval Priority Order:
In your system, retrieval tries:
1. **Hyperspell first** (if configured) - Vector/semantic search
2. **BM25 local index** (fallback) - Keyword-based search
3. **File-scan** (last resort) - Basic text matching

#### For Teacher App:
- **Knowledge Base**: Stores all your educational `.md` documents
- **Smart Search**: Students ask "Explain cell division" → finds relevant sections even if exact phrase doesn't exist
- **Context-Aware**: Understands related concepts (e.g., "mitosis" matches "cell division")

---

## 2. 🎙️ LiveKit

### What It Is
**LiveKit** is a real-time communication platform that enables voice/video chat, screen sharing, and live streaming. It provides WebRTC infrastructure for peer-to-peer communication.

### What It Does

#### Core Functionality:
- **Real-Time Voice/Video**: Enables live audio/video communication
- **Room-Based**: Users join "rooms" where they can interact
- **WebRTC**: Uses WebRTC for low-latency, peer-to-peer connections
- **STT/TTS Support**: Can integrate with speech-to-text and text-to-speech services

#### In Your Project:

1. **Token Generation** (`/voice/token`)
   ```typescript
   // Generates secure JWT token for LiveKit room access
   const token = AccessToken.generate(roomName, participantId, {
     canPublish: true,
     canSubscribe: true
   })
   ```
   - Creates secure access tokens for joining rooms
   - Tokens expire after 10 minutes (security)
   - Each user gets their own token

2. **Room Connection** (Frontend)
   ```typescript
   // Client connects to LiveKit room
   const room = new Room()
   await room.connect(wsUrl, token)
   ```
   - Establishes WebSocket connection to LiveKit server
   - Joins a named room (e.g., "student-session-123")
   - Can publish audio/video tracks

3. **Audio Publishing**
   ```typescript
   // Captures microphone and sends to room
   const audioTrack = await createLocalAudioTrack()
   await room.localParticipant.publishTrack(audioTrack)
   ```
   - Captures user's microphone
   - Sends audio stream to LiveKit
   - Other participants (like AI agent) can receive it

4. **Transcription Webhook** (`/webhooks/livekit/transcription`)
   - LiveKit sends transcribed text when speech is detected
   - Your server receives: `{ transcript: "Hello", is_final: true }`
   - Processes transcript through your answer service
   - (Future: Sends audio response back via TTS)

#### Current Status:
✅ **Configured**: All credentials set up
✅ **Token Generation**: Working
✅ **Room Connection**: Frontend can connect
⚠️ **Partial**: Uses browser Web Speech API instead of full LiveKit STT/TTS

#### For Teacher App:
- **Voice Questions**: Students speak questions instead of typing
- **Hands-Free Learning**: Useful for studying while reviewing materials
- **Accessibility**: Great for students with typing difficulties
- **Mobile-Friendly**: Voice interface works well on phones/tablets

---

## 3. 💾 Convex

### What It Is
**Convex** is a modern backend-as-a-service (BaaS) that provides a real-time database with automatic reactivity. It's like Firebase but with better TypeScript support and automatic reactivity.

### What It Does

#### Core Functionality:
- **Database**: Stores structured data (sessions, messages, actions)
- **Real-Time**: Automatically syncs data to connected clients
- **Serverless Functions**: Runs backend functions in the cloud
- **Type-Safe**: Generates TypeScript types from your schema

#### In Your Project:

1. **Sessions Table**
   ```typescript
   // Stores chat/study sessions
   {
     channel: "voice" | "slack" | "forum" | "email",
     persona: "Greeter" | "Moderator" | "Escalator",
     userName: "John Doe",
     startedAt: 1234567890,
     endedAt: 0 // 0 = active session
   }
   ```
   - Tracks when study sessions start/end
   - Associates sessions with users
   - Stores session metadata

2. **Messages Table**
   ```typescript
   // Stores all Q&A interactions
   {
     sessionId: "session-123",
     from: "user" | "agent" | "human",
     text: "What is photosynthesis?",
     sourceRefs: [{ type: "document", id: "bio-ch5", url: "..." }],
     latencyMs: 250,
     ts: 1234567890
   }
   ```
   - Stores every question and answer
   - Tracks response times
   - Links answers to source documents
   - Indexed by session for fast retrieval

3. **Actions Table**
   ```typescript
   // Logs all actions taken (Slack, Calendar, etc.)
   {
     sessionId: "session-123",
     type: "slack" | "calendar" | "github" | "forum",
     status: "ok" | "error" | "mocked",
     payload: { ... },
     result: { ... },
     ts: 1234567890
   }
   ```
   - Audit trail of all actions
   - Tracks what worked and what failed
   - Useful for debugging and analytics

4. **Escalations Table**
   ```typescript
   // Tracks when human teacher intervention needed
   {
     sessionId: "session-123",
     reason: "Question too complex",
     severity: "P0" | "P1" | "P2",
     agentmailThreadId: "...",
     status: "open" | "ack" | "closed"
   }
   ```

#### Operations Available:

**Sessions:**
- `sessions:start` - Create new session
- `sessions:end` - Close a session
- `sessions:list` - Get all sessions

**Messages:**
- `messages:append` - Add message to session
- `messages:bySession` - Get all messages for a session (indexed query)

**Actions:**
- `actions:log` - Log an action
- `actions_list:listBySession` - Get all actions for a session

#### For Teacher App:
- **Learning History**: Stores all student questions and answers
- **Session Continuity**: Students can resume previous conversations
- **Progress Tracking**: See what topics students have covered
- **Analytics**: Teachers can review student interaction patterns
- **Audit Trail**: Track all actions taken (calendar events, Slack posts, etc.)

---

## 4. 🤖 OpenAI

### What It Is
**OpenAI** provides Large Language Models (LLMs) like GPT-4, GPT-3.5, and GPT-4o-mini that can understand and generate human-like text.

### What It Does

#### Core Functionality:
- **Text Generation**: Creates human-like responses to prompts
- **Conversational AI**: Maintains context across multiple turns
- **Instruction Following**: Follows system prompts and guidelines
- **Multiple Models**: Various models with different capabilities/costs

#### In Your Project:

1. **Chat Completion API**
   ```typescript
   // Sends request to OpenAI
   await openaiChat({
     model: "gpt-4o-mini",
     system: "You are a helpful teacher assistant...",
     user: "What is photosynthesis?"
   })
   ```
   - Sends system prompt (defines AI behavior)
   - Sends user question
   - Returns generated response text

2. **Used For:**
   - **Answering Questions** (`/llm/answer`) - Direct Q&A
   - **Summarization** (`/llm/summarize`) - Condensing long texts
   - **Escalation Analysis** (`/llm/escalate`) - Determining if human help needed
   - **Explanation Generation** - In answer service, synthesizes retrieval results

3. **Configuration:**
   - **Model**: Default is `gpt-4o-mini` (cost-effective)
   - **Temperature**: `0.2` (more deterministic, less creative)
   - **Provider**: Can be set as default via `LLM_DEFAULT_PROVIDER=openai`

#### How It Works:
1. **Tokenization**: Converts text to tokens (pieces of words)
2. **Processing**: Neural network processes tokens with attention mechanism
3. **Generation**: Generates tokens one by one to form response
4. **Decoding**: Converts tokens back to text

#### System Prompts Used:

**SYSTEM_ANSWER**: Defines how AI should answer questions
- Be helpful and educational
- Use retrieval context when available
- Cite sources

**SYSTEM_SUMMARIZE**: Instructions for summarization
- Extract key points
- Be concise
- Maintain important details

**SYSTEM_ESCALATE**: Criteria for escalation
- Detect complex questions
- Identify when human teacher needed
- Classify severity

#### For Teacher App:
- **Personalized Explanations**: Adapts to student's level and questions
- **Concept Clarification**: Explains same concept multiple ways
- **Study Guide Generation**: Creates summaries from long documents
- **Escalation Detection**: Flags when student needs human help

---

## 5. 🔮 Perplexity

### What It Is
**Perplexity** is an AI search engine that combines LLM capabilities with real-time web search. It's like ChatGPT but with access to current information and citations.

### What It Does

#### Core Functionality:
- **LLM + Web Search**: Answers questions using current web information
- **Citations**: Automatically cites sources in responses
- **Real-Time Data**: Can access current information (not just training data)
- **Multiple Models**: Various models including online-capable ones

#### In Your Project:

1. **Same Interface as OpenAI**
   ```typescript
   // Uses same API structure as OpenAI
   await perplexityChat({
     model: "pplx-7b-online",
     system: "You are a helpful teacher...",
     user: "What is photosynthesis?"
   })
   ```
   - Same function signature as OpenAI
   - Different endpoint: `https://api.perplexity.ai/chat/completions`

2. **Additional Features:**
   - **Citations**: Returns `citations` array in response
   - **Online Models**: Models like `pplx-7b-online` have web access
   - **Real-Time Info**: Can answer questions about current events

3. **Usage:**
   - Specify `provider: "perplexity"` in requests
   - Or set `LLM_DEFAULT_PROVIDER=perplexity` as default
   - Good for questions needing current information

#### Differences from OpenAI:

| Feature | OpenAI | Perplexity |
|---------|--------|------------|
| Web Access | ❌ No | ✅ Yes (online models) |
| Citations | ❌ No | ✅ Yes |
| Training Data | Up to training cutoff | + Current web |
| Cost | Varies by model | Varies by model |
| Speed | Fast | Slightly slower (web search) |

#### For Teacher App:
- **Current Information**: Answers questions about recent discoveries/events
- **Source Citations**: Provides citations students can verify
- **Research Assistance**: Helps with topics needing current data
- **Alternative Provider**: Fallback if OpenAI has issues

---

## 6. 🌿 Moss (Inferedge)

### What It Is
**Moss** (by Inferedge) is a vector database service similar to Hyperspell, designed for semantic search and document indexing. It's currently **disabled** in your project due to SDK compatibility issues.

### What It Does

#### Core Functionality:
- **Vector Database**: Stores document embeddings for semantic search
- **Document Indexing**: Converts text documents into searchable vectors
- **Query Interface**: Searches indexed documents by meaning

#### In Your Project:

**Status**: ❌ **Temporarily Disabled**

1. **Moss Bridge Service** (`apps/moss-bridge/`)
   - Standalone Express server that wraps Moss SDK
   - Runs on `http://127.0.0.1:4050`
   - Handles ESM/CJS compatibility issues

2. **Endpoints:**
   - `POST /ensure` - Creates/loads index
   - `POST /index` - Indexes documents
   - `POST /query` - Searches indexed documents

3. **Why Disabled:**
   - SDK has ESM/CJS compatibility issues
   - Bridge service created as workaround
   - Currently using Hyperspell + BM25 fallback instead

#### How It Would Work (When Re-enabled):

1. **Indexing:**
   ```typescript
   await mossBridgeIndex([
     { id: "doc1", text: "Document content...", source: "bio.md" }
   ])
   ```
   - Converts documents to vectors using "moss-minilm" model
   - Stores in named index (default: "seed")

2. **Querying:**
   ```typescript
   const results = await mossBridgeQuery("What is photosynthesis?")
   // Returns: [{ source: "bio.md", text: "relevant excerpt..." }]
   ```
   - Searches vectors by semantic similarity
   - Returns top matching documents

#### Retrieval Strategy (If Enabled):
Would be inserted into retrieval priority:
1. Hyperspell (primary)
2. **Moss** (alternative vector search)
3. BM25 local index (fallback)
4. File-scan (last resort)

#### For Teacher App:
- **Alternative Vector Search**: Backup to Hyperspell
- **Redundancy**: If Hyperspell fails, Moss could take over
- **Same Capabilities**: Semantic search of educational documents

---

## 7. 🔗 Composio (via Rube.app)

### What It Is
**Composio** (now accessed via Rube.app) is a unified API platform that connects to multiple third-party services like Slack, Google Calendar, and GitHub. It handles OAuth authentication and provides a single interface for multiple services.

### What It Does

#### Core Functionality:
- **Unified API**: One API to access Slack, Calendar, GitHub, etc.
- **OAuth Management**: Handles authentication tokens automatically
- **Action Execution**: Executes actions across different services
- **Connection Management**: Manages service connections via dashboard

#### In Your Project:

1. **Slack Integration** (`/actions/slack`)
   ```typescript
   // Posts message to Slack channel
   await composio.executeAction({
     connectedAccountId: SLACK_ACCOUNT_ID,
     action: "SLACK_SEND_MESSAGE",
     params: {
       channel_id: "C09Q8AD2KHS",
       text: "Hello from teacher app!"
     }
   })
   ```
   - Connects to Slack workspace
   - Posts messages to channels
   - Returns permalink to message

2. **Google Calendar Integration** (`/actions/calendar`)
   ```typescript
   // Creates calendar event
   await composio.executeAction({
     connectedAccountId: GCAL_ACCOUNT_ID,
     action: "GOOGLECALENDAR_CREATE_EVENT",
     params: {
       calendar_id: "...",
       summary: "Study Session",
       start_datetime: "2024-01-01T10:00:00Z",
       end_datetime: "2024-01-01T11:00:00Z"
     }
   })
   ```
   - Creates events in Google Calendar
   - Supports recurring events
   - Returns event link

3. **GitHub Integration** (`/actions/github`)
   ```typescript
   // Creates GitHub issue
   await composio.executeAction({
     connectedAccountId: GITHUB_ACCOUNT_ID,
     action: "GITHUB_CREATE_ISSUE",
     params: {
       repo_slug: "owner/repo",
       title: "Assignment: Complete homework",
       body: "Description..."
     }
   })
   ```
   - Creates issues in GitHub repositories
   - Can assign labels, assignees
   - Returns issue URL

#### Configuration:
- **Dashboard Setup Required**: Must configure connections in Composio/Rube dashboard
- **Connected Account IDs**: Each service needs to be connected and set as default
- **API Key**: Single API key accesses all connected services

#### Current Status:
⚠️ **Mock Mode**: Currently using mock responses
- Set `MOCK_ACTIONS=false` to enable real actions
- Requires dashboard configuration first

#### For Teacher App:
- **Study Group Coordination**: Post to Slack study groups
- **Study Scheduling**: Create calendar events for study sessions
- **Assignment Tracking**: Create GitHub issues for coding assignments
- **Productivity Automation**: All in one unified API

---

## 8. 🌐 BrowserUse (Playwright)

### What It Is
**BrowserUse** in your project is actually implemented using **Playwright**, a browser automation library. It allows your server to control a headless browser to interact with web pages.

### What It Does

#### Core Functionality:
- **Browser Automation**: Controls a Chromium browser programmatically
- **Web Interaction**: Can fill forms, click buttons, navigate pages
- **Screenshot Capture**: Takes screenshots of web pages
- **Headless Mode**: Runs without UI (faster, no visual display)

#### In Your Project:

1. **Forum Posting** (`/forum/post`)
   ```typescript
   // Uses Playwright to post to forum
   const browser = await chromium.launch({ headless: true })
   const page = await browser.newPage()
   await page.goto("http://localhost:4001/public/forum.html")
   await page.fill("#user", username)
   await page.fill("#pass", password)
   await page.click("#login")
   await page.fill("#reply", text)
   await page.click("#post")
   await page.screenshot({ path: "screenshot.png" })
   ```
   - Launches headless browser
   - Navigates to forum page
   - Logs in with credentials
   - Posts message
   - Takes screenshot as proof

2. **What It Can Do:**
   - **Navigate**: Go to any URL
   - **Interact**: Click buttons, fill forms, select dropdowns
   - **Extract**: Read text content from pages
   - **Screenshot**: Capture visual state of page
   - **Wait**: Wait for elements to load/appear

3. **Current Implementation:**
   - **Forum Posting**: Only implemented use case
   - **Screenshot Storage**: Saves to `screenshots/` directory
   - **Error Handling**: Returns errors if page interaction fails

#### Capabilities (Extendable):
- **Web Scraping**: Extract content from educational websites
- **Form Submission**: Submit homework/assignments online
- **Data Extraction**: Pull information from online resources
- **Visual Verification**: Screenshots as proof of action

#### For Teacher App:
- **Forum Integration**: Post student questions to class forums
- **Web Research**: Scrape educational content from websites
- **Assignment Submission**: Automate online homework submission
- **Visual Documentation**: Screenshots of completed actions
- **Content Aggregation**: Pull study materials from various sites

---

## 🔄 How They Work Together

### Example: Student Asks Question

1. **Student**: Asks "What is photosynthesis?" via voice (LiveKit)
2. **LiveKit**: Transcribes speech → sends to `/webhooks/livekit/transcription`
3. **Answer Service**: 
   - Searches Hyperspell for relevant documents
   - Finds biology notes about photosynthesis
   - Sends context to OpenAI for explanation
   - Gets synthesized answer with citations
4. **Convex**: Stores question and answer in messages table
5. **Response**: (Future) Text-to-speech via LiveKit or text display

### Example: Study Session Scheduled

1. **Student**: "Schedule 30 minutes for biology review tomorrow at 2pm"
2. **LLM**: Extracts: `{ title: "Biology Review", start: "2024-01-02T14:00:00Z", duration: 30 }`
3. **Composio**: Creates Google Calendar event
4. **Convex**: Logs action in actions table
5. **Email** (AgentMail): Sends confirmation email
6. **Slack** (Composio): Posts reminder to study group

### Example: Document Indexing

1. **Admin**: Adds new biology chapter `.md` file to `seed/` directory
2. **Indexing**: `/retrieval/indexSeed` endpoint:
   - Reads all `.md` files from `seed/`
   - Splits into chunks (500 chars each)
   - Sends to Hyperspell vault via `hyperspellSeedText()`
   - Also builds BM25 local index as fallback
3. **Ready**: Documents now searchable via `/api/answer`

---

## 📊 Summary Table

| API | Type | Status | Primary Use |
|-----|------|--------|-------------|
| **Hyperspell** | Vector Search | ✅ Active | Semantic document search |
| **LiveKit** | Voice/Video | ✅ Configured | Real-time voice chat |
| **Convex** | Database | ✅ Active | Session & message storage |
| **OpenAI** | LLM | ✅ Configured | Text generation & Q&A |
| **Perplexity** | LLM+Search | ✅ Configured | Q&A with citations |
| **Moss** | Vector DB | ❌ Disabled | Alternative vector search |
| **Composio** | Actions API | ⚠️ Mock | Slack/Calendar/GitHub actions |
| **BrowserUse** | Automation | ✅ Active | Forum posting & web automation |

---

*This architecture enables a comprehensive educational assistant that combines intelligent search, natural language processing, persistent storage, voice interaction, and productivity automation.*

