# Apex Academy - Nuxt 3 EdTech Frontend

Apex Academy is a Nuxt 3-based educational platform for learning Computer Science subjects. It uses Sutradhar (the worker API) as its backend, abstracting all external services.

## Features

- 🎃 Halloween-themed dark UI with neon accents
- 📚 5 CS Subjects (C++, Java, Web Dev, Android, ML)
- 🤖 AI-powered tutoring via Sutradhar
- 📝 Interactive lessons and quizzes
- 💻 Coding assignments with hints
- 🏆 Progress tracking, streaks, and badges
- 📅 Calendar integration for study plans
- 🎤 Live study rooms (LiveKit)

## Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Sutradhar worker running on `http://localhost:4001`

## Installation

```bash
cd apps/nuxt
pnpm install
```

## Configuration

Set environment variables (or use defaults):

```bash
# .env
SUTRADHAR_BASE_URL=http://localhost:4001
```

## Development

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Build

```bash
pnpm build
pnpm preview  # Preview production build
```

## Pages

- `/` - Landing page
- `/login` - Guest mode or magic link login
- `/subjects` - Browse all subjects
- `/subjects/[slug]` - Subject hub (lessons, quizzes, images)
- `/lesson/[id]` - Lesson viewer
- `/quiz/[id]` - Quiz player
- `/code/[assignmentId]` - Coding assignment with hints
- `/dashboard` - Progress, streaks, badges
- `/room/[id]` - Live study room
- `/admin` - Admin panel for indexing and testing

## Architecture

The frontend **only** calls Sutradhar routes:
- Auth: `/auth/guest`, `/auth/magic`, `/auth/verify`
- Catalog: `/catalog`, `/course/:slug/lessons`, `/lesson/:id`
- Quizzes: `/quiz/:id`, `/quiz/:id/attempt`
- Code: `/code/:assignmentId`, `/code/:id/hint`, `/code/:id/run`
- Assistant: `/assistant/answer`, `/assistant/escalate`, `/assistant/forum`
- Progress: `/progress`, `/schedule/study`
- LiveKit: `/room/:id/join`
- Admin: `/admin/seed/index`, `/admin/images/cache`

All external services (Convex, AgentMail, LiveKit, Composio, etc.) are handled internally by Sutradhar.

## Themes & Styling

Uses Tailwind CSS with a custom Halloween palette:
- Background: `halloween-bg` (#0a0a0a)
- Cards: `halloween-card` (#2a2a2a)
- Accent: `halloween-orange` (#ff6b35)
- Text: `halloween-ghost` (#e0e0e0)

## Guest Mode

Users can start learning immediately without signup. A guest session is created automatically.

## Notes

- Magic links are in-memory for demo (use Redis in production)
- Code runner uses basic Node.js sandboxing (implement proper sandboxing for production)
- Hint tutor includes guardrails to prevent full solution disclosure

