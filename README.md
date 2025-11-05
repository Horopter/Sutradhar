# Sutradhar - Three-Layer Architecture

## Overview

Sutradhar is now a three-layer architecture:

1. **Sutradhar** - Pure agent orchestrator (agent-agnostic)
2. **Optimus** - Backend agents layer (frontend-agnostic, uses Sutradhar)
3. **Apex Academy** - Frontend application (uses Optimus)

## Architecture

```
┌─────────────────┐
│  Apex Academy   │  (Frontend - Port 3000)
│   (Nuxt/Vue)    │
└────────┬────────┘
         │ HTTP
         │ Calls Optimus API
         ▼
┌─────────────────┐
│    Optimus      │  (Backend Agents - Port 4001)
│  (EdTech API)   │
└────────┬────────┘
         │ HTTP
         │ Uses Sutradhar Orchestrator
         ▼
┌─────────────────┐
│   Sutradhar     │  (Orchestrator - Port 5000)
│  (Orchestrator) │
└────────┬────────┘
         │
         ├──► AgentMail (email agent)
         ├──► Composio (action agent)
         ├──► OpenAI (LLM agent)
         ├──► Hyperspell (retrieval agent)
         └──► Convex (data agent)
```

## Quick Start

### 1. Start Sutradhar Orchestrator

```bash
cd apps/sutradhar
npm install
npm run dev
```

Runs on `http://localhost:5000`

### 2. Start Optimus Backend

```bash
cd apps/optimus
npm install
npm run dev
```

Runs on `http://localhost:4001`

### 3. Start Apex Academy Frontend

```bash
cd apps/apex-academy
pnpm install
pnpm dev
```

Runs on `http://localhost:3000`

## Layer Responsibilities

### Layer 1: Sutradhar (Orchestrator)

**Purpose**: Pure agent orchestration engine, completely agent-agnostic.

**Responsibilities**:
- Agent registry and discovery
- Agent runtime management (in-process, HTTP, container, process)
- Load balancing and routing
- Health monitoring and circuit breakers
- Resource management

**API**: `http://localhost:5000/orchestrator`

### Layer 2: Optimus (Backend Agents)

**Purpose**: Creates backend agents for specific use cases by combining agents via Sutradhar.

**Responsibilities**:
- Use case-specific agents (EdTech: Auth, Course, Tutoring, Quiz, etc.)
- Agent composition (combines multiple Sutradhar agents)
- Use case-specific business logic
- Domain-specific routes (EdTech routes)

**API**: `http://localhost:4001`

### Layer 3: Apex Academy (Frontend)

**Purpose**: Frontend application that uses Optimus backend.

**Responsibilities**:
- UI components
- Frontend routing
- User interactions
- Display and presentation

**URL**: `http://localhost:3000`

## Documentation

- **[Architecture Refactor](docs/ARCHITECTURE_REFACTOR.md)** - Detailed architecture documentation
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Step-by-step migration guide
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture
- **[Agent Orchestration](docs/AGENT_ORCHESTRATION.md)** - Agent orchestration design
- **[Competitive Analysis](docs/COMPETITIVE_ANALYSIS.md)** - Market analysis

## Environment Variables

All environment variables remain in root `.env` and `.secrets.env` files.

**Key Variables**:
- `SUTRADHAR_PORT=5000` - Orchestrator port
- `OPTIMUS_PORT=4001` - Backend port
- `SUTRADHAR_URL=http://localhost:5000` - Optimus → Sutradhar connection
- `OPTIMUS_BASE_URL=http://localhost:4001` - Apex Academy → Optimus connection

## Development Status

### ✅ Completed
- Directory structure created
- Sutradhar orchestrator core
- Runtime implementations (in-process, HTTP)
- Orchestrator API routes
- Sutradhar client for Optimus
- Optimus server skeleton
- Apex Academy renamed and configured

### ⏳ In Progress
- Convert core services to Sutradhar agents
- Move EdTech agents to Optimus
- Update Optimus routes
- End-to-end testing

## Migration

See [Migration Guide](docs/MIGRATION_GUIDE.md) for detailed migration steps.

## License

ISC
