# Sutradhar Architecture Redesign

## Overview

Sutradhar is being redesigned to fully abstract and encapsulate all external API complexity, providing a clean, unified interface for UI/UX requests.

## Design Principles

1. **Abstraction**: All external APIs are hidden behind Sutradhar's unified services
2. **Encapsulation**: External API details never leak to routes or UI layer
3. **Unified Interface**: Single, consistent API for all operations
4. **UI-First**: Endpoints designed for common UI/UX patterns
5. **Internal Complexity**: All external API handling is private to Sutradhar

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    UI / Frontend                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────┐
│              Sutradhar API Layer                        │
│  Clean, intuitive endpoints for UI/UX patterns          │
│  /api/v1/* endpoints                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│          Unified Service Layer                          │
│  Business logic, orchestration, unified interfaces      │
│  - ConversationService                                  │
│  - KnowledgeService                                     │
│  - CommunicationService                                 │
│  - ActionService                                        │
│  - MediaService                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│            Adapter Layer (Private)                      │
│  Wraps external APIs, converts to internal models       │
│  - EmailAdapter (AgentMail)                             │
│  - StorageAdapter (Convex)                              │
│  - SearchAdapter (Hyperspell, Moss)                     │
│  - LLMAdapter (OpenAI, Perplexity)                      │
│  - CommunicationAdapter (Slack, GitHub, Calendar)       │
│  - VoiceAdapter (LiveKit)                               │
│  - BrowserAdapter (Playwright)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│       External API Clients (Private)                    │
│  Direct SDK/client usage - never exposed                │
└─────────────────────────────────────────────────────────┘
```

## New Folder Structure

```
apps/worker/src/
├── api/                          # Public API layer (UI-focused)
│   └── v1/
│       ├── conversations.ts      # Chat, Q&A endpoints
│       ├── knowledge.ts          # Search, indexing
│       ├── communications.ts     # Messages, channels
│       ├── scheduling.ts         # Calendar, events
│       ├── collaboration.ts      # Issues, tasks
│       ├── media.ts              # Images, voice
│       └── system.ts             # Health, auth, config
│
├── services/                     # Unified service layer
│   ├── conversation-service.ts   # Orchestrates chat/Q&A
│   ├── knowledge-service.ts      # Search & retrieval
│   ├── communication-service.ts  # Messages, notifications
│   ├── action-service.ts         # Actions & integrations
│   ├── media-service.ts          # Images, voice, files
│   └── session-service.ts        # Sessions & context
│
├── adapters/                     # External API adapters (private)
│   ├── email/
│   │   └── agentmail-adapter.ts
│   ├── storage/
│   │   └── convex-adapter.ts
│   ├── search/
│   │   ├── hyperspell-adapter.ts
│   │   └── moss-adapter.ts
│   ├── llm/
│   │   ├── openai-adapter.ts
│   │   └── perplexity-adapter.ts
│   ├── communication/
│   │   ├── slack-adapter.ts
│   │   ├── github-adapter.ts
│   │   └── calendar-adapter.ts
│   ├── voice/
│   │   └── livekit-adapter.ts
│   └── browser/
│       └── playwright-adapter.ts
│
├── models/                       # Domain models & DTOs
│   ├── conversation.ts           # Messages, sessions
│   ├── knowledge.ts              # Documents, search results
│   ├── communication.ts          # Channels, messages
│   ├── action.ts                 # Actions, tasks
│   └── media.ts                  # Images, voice
│
├── core/                         # Core infrastructure (unchanged)
│   ├── cache/
│   ├── guardrails/
│   ├── middleware/
│   ├── logging/
│   └── types.ts
│
└── external/                     # External API clients (private)
    ├── agentmail/
    ├── convex/
    ├── hyperspell/
    ├── moss/
    ├── composio/
    ├── openai/
    ├── perplexity/
    ├── livekit/
    └── playwright/
```

## Unified Service Interfaces

### 1. ConversationService
Unified interface for all conversation/Q&A needs.

```typescript
interface ConversationService {
  // Chat & Q&A
  ask(question: string, context?: ConversationContext): Promise<Answer>
  chat(message: string, sessionId: string): Promise<ChatResponse>
  
  // Context & Memory
  getConversation(sessionId: string): Promise<Conversation>
  getHistory(sessionId: string, limit?: number): Promise<Message[]>
}
```

### 2. KnowledgeService
Unified interface for search and knowledge retrieval.

```typescript
interface KnowledgeService {
  // Search
  search(query: string, options?: SearchOptions): Promise<SearchResults>
  searchImages(query: string | Image, options?: SearchOptions): Promise<ImageResults>
  
  // Indexing
  indexContent(content: Content): Promise<void>
  indexImage(image: ImageInput): Promise<void>
}
```

### 3. CommunicationService
Unified interface for all messaging/notification needs.

```typescript
interface CommunicationService {
  // Messages
  sendMessage(channel: Channel, message: Message): Promise<MessageResult>
  getMessages(channel: Channel, options?: MessageOptions): Promise<Message[]>
  
  // Channels
  listChannels(platform: Platform): Promise<Channel[]>
  getChannel(id: string, platform: Platform): Promise<Channel>
}
```

### 4. ActionService
Unified interface for actions across platforms.

```typescript
interface ActionService {
  // Tasks & Actions
  createTask(task: Task): Promise<TaskResult>
  updateTask(id: string, updates: TaskUpdate): Promise<TaskResult>
  
  // Platform-specific (abstracted)
  createIssue(repo: string, issue: Issue): Promise<IssueResult>
  scheduleEvent(calendar: string, event: Event): Promise<EventResult>
}
```

### 5. MediaService
Unified interface for media operations.

```typescript
interface MediaService {
  // Images
  searchImages(query: string | Image): Promise<ImageResults>
  indexImage(image: ImageInput): Promise<void>
  
  // Voice
  startVoiceSession(config: VoiceConfig): Promise<VoiceSession>
  generateVoiceToken(sessionId: string): Promise<string>
}
```

## API Endpoint Design (UI-Focused)

### Conversations
```
POST   /api/v1/conversations/ask          # Ask a question
POST   /api/v1/conversations/chat         # Chat message
GET    /api/v1/conversations/:id          # Get conversation
GET    /api/v1/conversations/:id/history  # Get message history
POST   /api/v1/conversations/:id/end      # End conversation
```

### Knowledge
```
POST   /api/v1/knowledge/search           # Search documents
POST   /api/v1/knowledge/search/images    # Search images
POST   /api/v1/knowledge/index            # Index content
```

### Communications
```
POST   /api/v1/messages                   # Send message
GET    /api/v1/messages                   # List messages
GET    /api/v1/channels                   # List channels
GET    /api/v1/channels/:id               # Get channel
```

### Scheduling
```
POST   /api/v1/events                     # Create event
GET    /api/v1/events                     # List events
PUT    /api/v1/events/:id                 # Update event
DELETE /api/v1/events/:id                 # Delete event
```

### Collaboration
```
POST   /api/v1/issues                     # Create issue
GET    /api/v1/issues                     # List issues
GET    /api/v1/issues/:id                 # Get issue
PUT    /api/v1/issues/:id                 # Update issue
POST   /api/v1/issues/:id/comments        # Add comment
```

### Media
```
POST   /api/v1/media/images/search        # Search images
POST   /api/v1/media/images/index         # Index image
POST   /api/v1/media/voice/session        # Start voice session
GET    /api/v1/media/voice/token          # Get voice token
```

## Migration Strategy

1. Create new unified service interfaces
2. Implement adapters for each external API
3. Implement unified services using adapters
4. Create new UI-focused API routes
5. Migrate existing routes to use unified services
6. Deprecate old endpoints (with backward compatibility)

## Benefits

1. **Simplified UI Integration**: Clean, consistent endpoints
2. **API Agnostic**: Swap external APIs without changing UI
3. **Better Testing**: Mock adapters for testing
4. **Easier Maintenance**: Changes isolated to adapters
5. **Better Documentation**: Clear service contracts
6. **Type Safety**: Strong typing through models/DTOs

