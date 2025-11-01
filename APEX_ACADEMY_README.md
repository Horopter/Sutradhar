# Apex Academy - Implementation Summary

Apex Academy is a complete Nuxt 3 EdTech platform built on top of Sutradhar, demonstrating all integrated capabilities (AgentMail, LiveKit, Composio, Hyperspell, BM25, BrowserUse, etc.).

## ✅ Implementation Status

### Frontend (Nuxt 3) - ✅ Complete
- ✅ Landing page with Halloween theme
- ✅ Login (Guest mode + Magic link)
- ✅ Subjects catalog page
- ✅ Subject hub (Lessons, Quizzes, Images tabs)
- ✅ Lesson viewer with markdown rendering
- ✅ Quiz player with timer
- ✅ Coding assignment page (hint + run)
- ✅ Dashboard (progress, streaks, badges)
- ✅ Live study room page
- ✅ Admin panel
- ✅ Halloween-themed UI with Tailwind
- ✅ "Summon Sutradhar" floating action button
- ✅ Global notifications

### Backend (Worker Routes) - ✅ Complete
- ✅ `/auth/guest` - Create guest session
- ✅ `/auth/magic` - Send magic link email
- ✅ `/auth/verify` - Verify magic link token
- ✅ `/catalog` - List 5 CS subjects from data_repository
- ✅ `/course/:slug/lessons` - List lessons for a course
- ✅ `/lesson/:id` - Get lesson content
- ✅ `/course/:slug/images` - Get images (Moss bridge + fallback)
- ✅ `/quiz/:id` - Get quiz
- ✅ `/quiz/:id/attempt` - Submit quiz attempt
- ✅ `/code/:assignmentId` - Get coding assignment
- ✅ `/code/:assignmentId/hint` - Get hint (hint-only tutor)
- ✅ `/code/:assignmentId/run` - Run code with sandboxing
- ✅ `/assistant/answer` - Ask Sutradhar
- ✅ `/assistant/escalate` - Escalate via email
- ✅ `/assistant/forum` - Post to forum (BrowserUse)
- ✅ `/assistant/actions/:type` - Slack/Calendar/GitHub actions
- ✅ `/progress` - Get user progress
- ✅ `/schedule/study` - Create spaced repetition plan
- ✅ `/room/:id/join` - Join LiveKit room
- ✅ `/admin/seed/index` - Rebuild BM25 index
- ✅ `/admin/images/cache` - Cache images from Moss

### Convex Schema & Functions - ✅ Complete
- ✅ Extended schema with EdTech tables (users, courses, lessons, quizzes, quizAttempts, codeAssignments, codeSubmissions, images, events, schedules)
- ✅ Convex functions for all operations

### Features Implemented
- ✅ **Guest Mode** - No signup required
- ✅ **Magic Link Auth** - Email-based login via AgentMail
- ✅ **5 CS Subjects** - Auto-discovered from data_repository
- ✅ **Lesson Viewer** - Markdown rendering with citations
- ✅ **Quiz System** - Timed quizzes with scoring
- ✅ **Coding Tutor** - Hint-only (never reveals full solution)
- ✅ **Code Runner** - Basic sandboxing (Node.js, with safety checks)
- ✅ **Progress Tracking** - Streaks, badges, quiz attempts
- ✅ **Spaced Repetition** - 2-week calendar plan via Composio
- ✅ **Image Integration** - Moss bridge with local fallback
- ✅ **Live Study Rooms** - LiveKit integration
- ✅ **Admin Tools** - Index rebuilding, image caching, testing

## 🚀 Quick Start

### 1. Start Convex
```bash
cd apps/convex
npx convex dev
```

### 2. Start Worker
```bash
cd apps/worker
npm run dev  # Runs on port 4001
```

### 3. Start Nuxt
```bash
cd apps/nuxt
pnpm install
pnpm dev  # Runs on port 3000
```

### 4. Visit
- Frontend: http://localhost:3000
- Worker API: http://localhost:4001

## 📁 Project Structure

```
Sutradhar/
├── apps/
│   ├── nuxt/              # Apex Academy frontend
│   │   ├── pages/         # Nuxt pages
│   │   ├── components/    # Vue components
│   │   ├── composables/   # Composable functions
│   │   └── assets/        # Styles
│   ├── worker/            # Sutradhar worker
│   │   └── src/
│   │       └── routes/
│   │           └── edtech.ts  # EdTech routes
│   └── convex/            # Convex backend
│       ├── schema.ts      # Extended schema
│       └── src/           # Convex functions
└── data_repository/       # 5 CS subjects
    ├── CPlusPlus/
    ├── Java/
    ├── Web development/
    ├── Android app development/
    └── Machine Learning/
```

## 🎨 Design

Halloween-themed dark palette:
- Background: `#0a0a0a`
- Cards: `#2a2a2a`
- Accent: `#ff6b35` (pumpkin orange)
- Text: `#e0e0e0`
- Neon accents: `#39ff14`, `#ccff00`

## 🔌 Integration Points

All integrations go through **Sutradhar only**:

- **Convex** → Data storage (users, courses, progress)
- **AgentMail** → Magic link emails (dry-run supported)
- **LiveKit** → Voice rooms (`/voice/token`)
- **Composio** → Calendar/Slack/GitHub actions (mockable)
- **Hyperspell** → RAG search (`/api/answer`)
- **BM25** → Local search fallback
- **BrowserUse** → Forum posting with screenshots
- **Moss** → Image search (optional, with fallback)
- **OpenAI/Perplexity** → LLM for hints, summaries, tutoring

## 🔒 Safety Features

1. **Code Sandboxing** - Strips dangerous patterns (require, eval, process)
2. **Hint-Only Tutor** - System prompt forbids full solutions, code redaction guard
3. **Rate Limiting** - Per-endpoint rate limits
4. **Mock Toggles** - All external APIs can be mocked (`MOCK_*` env vars)

## 📝 TODO / Future Enhancements

- [ ] Full LiveKit SDK integration in `/room/[id]`
- [ ] Proper code sandboxing (vm2 or separate process)
- [ ] Python code runner
- [ ] Adaptive difficulty engine
- [ ] Flashcard generator
- [ ] Progress heatmap calendar
- [ ] Badge animations
- [ ] Quiz review sheets with explanations
- [ ] Redis for magic link tokens (currently in-memory)
- [ ] Proper markdown rendering library

## 🎯 Demo Flow

1. Visit http://localhost:3000
2. Click "Continue as Guest" (or login with magic link)
3. Browse Subjects → Select a course
4. View Lessons → Click a lesson
5. Take a Quiz → Complete and see results
6. Try Coding Assignment → Get hints, run code
7. Check Dashboard → See progress, streaks, badges
8. Visit Admin → Rebuild indexes, test integrations

## 🧪 Testing

### Test Guest Mode
```bash
curl -X POST http://localhost:4001/auth/guest
```

### Test Catalog
```bash
curl http://localhost:4001/catalog
```

### Test Answer
```bash
curl -X POST http://localhost:4001/assistant/answer \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","question":"What is C++?"}'
```

## 📚 API Documentation

All EdTech routes are documented in `apps/worker/src/routes/edtech.ts`.

Frontend only calls these routes - no direct third-party API calls.

## ⚙️ Environment Variables

Set these in `.env`:

```bash
# Worker
CONVEX_URL=http://127.0.0.1:3210
SUTRADHAR_BASE_URL=http://localhost:4001

# Optional
MOSS_BRIDGE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000

# Mock toggles
MOCK_LLM=true
MOCK_ACTIONS=true
MOCK_BROWSER=true
```

## 🎓 Subjects Supported

Auto-discovered from `data_repository/`:
1. **C++** (11 lessons)
2. **Java** (5 lessons)
3. **Web Development** (3 lessons)
4. **Android App Development** (2 lessons)
5. **Machine Learning** (4 lessons)

## 🏆 EdTech Features

- ✅ Guest Mode (no signup)
- ✅ Progress Tracking
- ✅ Streaks & Badges
- ✅ Spaced Repetition
- ✅ Hint-Only Tutoring
- ✅ Live Study Rooms
- ✅ Calendar Integration
- ✅ Forum Posting

---

**Built with:** Nuxt 3, Tailwind CSS, Convex, Express, TypeScript
**Powered by:** Sutradhar API

