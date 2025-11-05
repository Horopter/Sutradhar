# Agent Orchestration Architecture

## Vision

Transform Sutradhar from a service that runs agents internally into a **platform for orchestrating agents** - similar to how Kubernetes orchestrates containers. Agents become first-class, independently deployable units that Sutradhar manages, routes to, and monitors.

## Competitive Landscape & Strategic Positioning

### Market Analysis

After analyzing platforms like Boomi, Refold AI, CrewAI, LangChain, Pipecat, and Kubiya AI, we've identified key market gaps and opportunities:

| Platform | Strengths | Weaknesses | Sutradhar Opportunity |
|----------|-----------|------------|----------------------|
| **Boomi** | 200+ connectors, low-code, cloud-native | Vendor lock-in, limited customization, high cost | Vendor-neutral, open-source, composable |
| **CrewAI** | Multi-agent orchestration, collaborative agents | Steep learning curve, Python-only | Multi-language, developer-friendly |
| **LangChain** | LLM framework, RAG support | Scaling challenges, complex setup | Built-in scaling, simpler abstractions |
| **Pipecat** | Enterprise voice AI, low-latency | Complex setup, limited community | Streamlined voice integration, better DX |
| **Kubiya AI** | Zero-trust security, contextual memory | DevOps niche, limited applicability | Universal platform, security-first |
| **Refold AI** | Task-specific agents | Scalability concerns, integration challenges | Scalable architecture, easy integration |

### Sutradhar's Competitive Advantages

1. **Developer-First Architecture**
   - Code-first with optional UI (not UI-first with limited code)
   - TypeScript-first for type safety
   - Clear, minimal abstractions
   - No vendor lock-in (open-source, portable agents)

2. **True Multi-Runtime Support**
   - In-process (current)
   - HTTP (external services)
   - Container (Docker/Kubernetes)
   - Process (fork/spawn)
   - Unlike competitors focused on single runtime

3. **Composable & Modular**
   - Agents as independent units (like Kubernetes pods)
   - Mix and match different agent types
   - Version agents independently
   - Scale agents independently

4. **Built-in Observability**
   - Per-agent metrics
   - Distributed tracing
   - Health monitoring
   - Circuit breakers

5. **Zero-Trust Security**
   - Agent isolation
   - Per-agent authentication
   - Resource limits
   - Audit logging

6. **Cost-Effective**
   - Open-source core
   - Self-hostable
   - No per-agent pricing
   - Efficient resource utilization

## Current Architecture (Internal Agents)

```
┌─────────────────────────────────────┐
│         Sutradhar API               │
│  ┌───────────────────────────────┐  │
│  │      Routes (edtech.ts)       │  │
│  └───────────┬───────────────────┘  │
│              │                        │
│  ┌───────────▼───────────────────┐  │
│  │    Agent Registry (in-process)│  │
│  │  - AuthAgent                  │  │
│  │  - CourseAgent                │  │
│  │  - TutoringAgent              │  │
│  └───────────┬───────────────────┘  │
│              │                        │
│  ┌───────────▼───────────────────┐  │
│  │    Services (internal)        │  │
│  │  - ConversationService        │  │
│  │  - KnowledgeService           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Limitations:**
- Agents are tightly coupled to Sutradhar
- Cannot scale agents independently
- Cannot deploy agents separately
- Cannot use external agents
- Hard to version agents independently
- No agent lifecycle management

## Proposed Architecture (Agent Orchestrator)

```
┌─────────────────────────────────────────────────────────────┐
│              Sutradhar Orchestrator                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Orchestration API                             │  │
│  │  - Register/Deploy agents                             │  │
│  │  - Route requests to agents                           │  │
│  │  - Monitor agent health                              │  │
│  │  - Scale agents                                       │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │            Agent Registry & Discovery                  │  │
│  │  - Agent catalog                                       │  │
│  │  - Health status                                       │  │
│  │  - Load balancing                                      │  │
│  │  - Circuit breakers                                    │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │            Agent Runtime Layer                         │  │
│  │  - In-process agents (current)                         │  │
│  │  - External HTTP agents                               │  │
│  │  - Container agents (Docker)                          │  │
│  │  - Process agents (fork/spawn)                         │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│        ┌──────────────────┼──────────────────┐              │
│        │                  │                  │              │
│  ┌─────▼─────┐    ┌───────▼──────┐    ┌─────▼─────┐        │
│  │  Agent A  │    │   Agent B    │    │  Agent C  │        │
│  │ (in-proc) │    │ (container)  │    │ (external) │        │
│  └───────────┘    └──────────────┘    └───────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Agent as First-Class Entity

Agents are independent, deployable units with:
- **Agent ID**: Unique identifier
- **Agent Type**: Function/capability (e.g., "auth", "course", "tutoring")
- **Runtime**: How agent runs (in-process, container, external HTTP)
- **Interface**: Contract/API the agent implements
- **Health**: Status and metrics
- **Resources**: CPU, memory, rate limits

### 2. Agent Registry (Like Kubernetes API Server)

```typescript
interface AgentRegistry {
  // Register a new agent
  register(agent: AgentDefinition): Promise<AgentHandle>;
  
  // Get agent by type
  get(type: string): Promise<AgentHandle[]>;
  
  // Deploy agent (create instance)
  deploy(agentId: string, config: DeploymentConfig): Promise<Deployment>;
  
  // Scale agent
  scale(agentId: string, replicas: number): Promise<void>;
  
  // Health check
  health(agentId: string): Promise<HealthStatus>;
  
  // List all agents
  list(): Promise<AgentHandle[]>;
}
```

### 3. Agent Runtime (Like Container Runtime)

Support multiple runtimes:

#### In-Process Runtime
```typescript
// Current agents run in-process
class InProcessRuntime implements AgentRuntime {
  async start(agent: AgentDefinition): Promise<AgentHandle> {
    // Instantiate agent class directly
    const instance = new agent.class();
    return { id: agent.id, instance, runtime: 'in-process' };
  }
}
```

#### HTTP Runtime
```typescript
// External HTTP agents
class HttpRuntime implements AgentRuntime {
  async start(agent: AgentDefinition): Promise<AgentHandle> {
    // Agent runs as external HTTP service
    return {
      id: agent.id,
      endpoint: agent.config.url,
      runtime: 'http',
      healthCheck: () => fetch(`${agent.config.url}/health`)
    };
  }
}
```

#### Container Runtime
```typescript
// Docker/container agents
class ContainerRuntime implements AgentRuntime {
  async start(agent: AgentDefinition): Promise<AgentHandle> {
    // Deploy as Docker container
    const container = await docker.run({
      image: agent.config.image,
      env: agent.config.env,
      ports: agent.config.ports
    });
    return {
      id: agent.id,
      containerId: container.id,
      runtime: 'container',
      endpoint: `http://localhost:${container.port}`
    };
  }
}
```

#### Process Runtime
```typescript
// Fork/spawn process agents
class ProcessRuntime implements AgentRuntime {
  async start(agent: AgentDefinition): Promise<AgentHandle> {
    // Spawn as separate Node.js process
    const process = spawn('node', [agent.config.script], {
      env: agent.config.env
    });
    return {
      id: agent.id,
      processId: process.pid,
      runtime: 'process',
      endpoint: agent.config.endpoint
    };
  }
}
```

## Agent Interface

Standard interface all agents must implement:

```typescript
interface IAgent {
  // Agent metadata
  id: string;
  type: string;
  version: string;
  
  // Capabilities
  capabilities(): string[];
  
  // Execute task
  execute(task: AgentTask): Promise<AgentResult>;
  
  // Health check
  health(): Promise<HealthStatus>;
  
  // Metrics
  metrics(): Promise<AgentMetrics>;
}

interface AgentTask {
  id: string;
  type: string;
  payload: any;
  context?: {
    sessionId?: string;
    userId?: string;
    requestId?: string;
  };
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    latency?: number;
    agentId?: string;
    version?: string;
  };
}
```

## Orchestration Features

### 1. Agent Discovery

```typescript
// Auto-discover agents
const agents = await orchestrator.discover({
  type: 'tutoring',  // Find all tutoring agents
  capabilities: ['hint', 'answer'],
  minHealth: 'healthy'
});

// Route request to best agent
const agent = orchestrator.select(agents, {
  strategy: 'least-loaded',  // or 'round-robin', 'random', 'latency-based'
  constraints: { version: '>=1.0.0' }
});
```

### 2. Load Balancing

```typescript
// Multiple instances of same agent
const tutoringAgents = [
  { id: 'tutoring-1', load: 0.3, health: 'healthy' },
  { id: 'tutoring-2', load: 0.7, health: 'healthy' },
  { id: 'tutoring-3', load: 0.1, health: 'healthy' }
];

// Route to least loaded
const agent = selectLeastLoaded(tutoringAgents); // tutoring-3
```

### 3. Health Monitoring

```typescript
// Continuous health checks
orchestrator.monitor({
  agentId: 'tutoring-1',
  interval: 5000,
  timeout: 1000,
  onUnhealthy: (agent) => {
    // Mark as unhealthy, remove from routing
    orchestrator.drain(agent.id);
  },
  onHealthy: (agent) => {
    // Add back to routing
    orchestrator.enable(agent.id);
  }
});
```

### 4. Scaling

```typescript
// Auto-scale based on load
orchestrator.autoScale({
  agentType: 'tutoring',
  minReplicas: 2,
  maxReplicas: 10,
  targetLoad: 0.7,
  scaleUpThreshold: 0.8,
  scaleDownThreshold: 0.3
});

// Manual scaling
await orchestrator.scale('tutoring-1', 5); // Scale to 5 replicas
```

### 5. Circuit Breakers

```typescript
// Circuit breaker per agent
const breaker = new CircuitBreaker({
  agentId: 'tutoring-1',
  failureThreshold: 5,
  resetTimeout: 30000
});

// Prevents routing to unhealthy agents
if (breaker.isOpen()) {
  // Route to backup agent
  agent = await orchestrator.get('tutoring-2');
}
```

## Implementation Strategy

### Phase 1: Orchestration Layer (Week 1)

1. **Create Orchestrator Core**
   ```typescript
   // apps/worker/src/orchestrator/
   ├── orchestrator.ts       # Main orchestrator
   ├── registry.ts           # Agent registry
   ├── runtime/              # Runtime implementations
   │   ├── in-process.ts
   │   ├── http.ts
   │   ├── container.ts
   │   └── process.ts
   ├── discovery.ts          # Agent discovery
   ├── load-balancer.ts      # Load balancing
   └── health-monitor.ts     # Health monitoring
   ```

2. **Agent Interface Standardization**
   - Define `IAgent` interface
   - Update existing agents to implement interface
   - Add agent metadata (id, type, version, capabilities)

3. **Basic Registry**
   - Register existing agents
   - Route requests through orchestrator
   - Maintain backward compatibility

### Phase 2: External Agents (Week 2)

4. **HTTP Runtime**
   - Support external HTTP agents
   - Agent discovery via HTTP endpoints
   - Health checks via `/health`
   - Standardized request/response format

5. **Agent Catalog**
   - List available agents
   - Agent metadata and capabilities
   - Version management

### Phase 3: Advanced Features (Week 3)

6. **Container Runtime**
   - Docker container support
   - Container lifecycle management
   - Resource limits

7. **Auto-scaling**
   - Load-based scaling
   - Horizontal scaling
   - Resource monitoring

8. **Process Runtime**
   - Fork/spawn processes
   - Process monitoring
   - IPC communication

## Migration Path

### Step 1: Wrap Existing Agents

```typescript
// apps/worker/src/orchestrator/runtime/in-process.ts
class InProcessAgentWrapper implements IAgent {
  constructor(
    private agent: BaseAgent,
    private id: string,
    private type: string
  ) {}
  
  async execute(task: AgentTask): Promise<AgentResult> {
    // Convert task to agent method call
    const method = this.agent[task.type];
    if (!method) {
      return { success: false, error: 'Method not found' };
    }
    
    const result = await method.call(this.agent, task.payload);
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: {
        agentId: this.id,
        latency: Date.now() - task.startTime
      }
    };
  }
  
  async health(): Promise<HealthStatus> {
    return { status: 'healthy', agentId: this.id };
  }
}
```

### Step 2: Update Routes to Use Orchestrator

```typescript
// Before
router.post('/auth/guest', asyncHandler(async (req, res) => {
  const agent = agentRegistry.get('AuthAgent');
  const result = await agent.createGuest();
  res.json({ ok: result.success, ...result.data });
}));

// After
router.post('/auth/guest', asyncHandler(async (req, res) => {
  const agent = await orchestrator.getAgent('auth');
  const result = await agent.execute({
    id: generateTaskId(),
    type: 'createGuest',
    payload: {},
    context: { requestId: req.headers['x-request-id'] }
  });
  res.json({ ok: result.success, ...result.data });
}));
```

### Step 3: Deploy External Agents

```typescript
// Register external HTTP agent
await orchestrator.register({
  id: 'external-tutoring-v2',
  type: 'tutoring',
  version: '2.0.0',
  runtime: 'http',
  config: {
    url: 'https://tutoring-agent.example.com',
    healthEndpoint: '/health',
    capabilities: ['hint', 'answer', 'explain']
  }
});

// Deploy
await orchestrator.deploy('external-tutoring-v2', {
  replicas: 3,
  healthCheck: { interval: 5000 }
});
```

## Benefits

1. **Decoupling**: Agents independent of Sutradhar core
2. **Scalability**: Scale agents independently
3. **Flexibility**: Mix in-process, HTTP, container agents
4. **Versioning**: Run multiple agent versions simultaneously
5. **Reliability**: Circuit breakers, health checks, auto-recovery
6. **Observability**: Per-agent metrics and monitoring
7. **Extensibility**: Add new agents without code changes
8. **Multi-tenancy**: Isolated agent instances per tenant

## Example: External Agent

```typescript
// External agent implementation (separate service)
// apps/tutoring-agent/src/index.ts
import express from 'express';

const app = express();

// Implement standard agent interface
app.post('/execute', async (req, res) => {
  const { type, payload } = req.body;
  
  let result;
  switch (type) {
    case 'answer':
      result = await answerQuestion(payload.question);
      break;
    case 'hint':
      result = await getHint(payload.assignment, payload.code);
      break;
    default:
      return res.status(400).json({ error: 'Unknown task type' });
  }
  
  res.json({
    success: true,
    data: result,
    metadata: {
      agentId: 'tutoring-agent-v2',
      version: '2.0.0',
      latency: result.latency
    }
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agentId: 'tutoring-agent-v2' });
});

app.listen(3001);
```

```typescript
// Register in Sutradhar
await orchestrator.register({
  id: 'tutoring-agent-v2',
  type: 'tutoring',
  version: '2.0.0',
  runtime: 'http',
  config: {
    url: 'http://localhost:3001',
    healthEndpoint: '/health'
  }
});
```

## API Design

### Orchestration API

```typescript
// POST /orchestrator/agents/register
{
  "id": "tutoring-agent-v2",
  "type": "tutoring",
  "version": "2.0.0",
  "runtime": "http",
  "config": {
    "url": "http://localhost:3001",
    "healthEndpoint": "/health"
  }
}

// GET /orchestrator/agents
// Returns list of all registered agents

// POST /orchestrator/agents/:id/deploy
{
  "replicas": 3,
  "resources": {
    "cpu": "500m",
    "memory": "512Mi"
  }
}

// GET /orchestrator/agents/:id/health
// Returns agent health status

// POST /orchestrator/agents/:id/scale
{
  "replicas": 5
}

// DELETE /orchestrator/agents/:id
// Unregister agent
```

### Task Routing

```typescript
// POST /orchestrator/tasks/execute
{
  "agentType": "tutoring",
  "task": {
    "type": "answer",
    "payload": {
      "question": "What is machine learning?"
    }
  },
  "constraints": {
    "version": ">=2.0.0",
    "capabilities": ["answer"]
  }
}
```

## Comparison with Kubernetes

| Kubernetes Concept | Sutradhar Orchestrator |
|-------------------|------------------------|
| Pod | Agent Instance |
| Deployment | Agent Deployment |
| Service | Agent Registry |
| ReplicaSet | Agent Scaling |
| Health Probe | Agent Health Check |
| ConfigMap | Agent Configuration |
| Secret | Agent Secrets |
| Ingress | Request Router |
| Namespace | Agent Tenant/Isolation |

## Key Differentiators

### 1. Developer Experience (vs. Boomi's Low-Code)

**Boomi Approach**: Low-code UI, limited customization
**Sutradhar Approach**: Code-first with optional UI

```typescript
// Developer-friendly, type-safe API
const agent = await orchestrator.register({
  id: 'my-agent',
  type: 'custom',
  runtime: 'in-process',
  implementation: class MyAgent implements IAgent {
    async execute(task: AgentTask) {
      // Type-safe, full control
    }
  }
});
```

**Advantage**: Developers have full control, can use TypeScript/IDE support, test like regular code.

### 2. Vendor Neutrality (vs. Boomi's Lock-In)

**Boomi**: Cloud-only, vendor lock-in
**Sutradhar**: Self-hostable, portable agents

- Agents can run anywhere (Docker, Kubernetes, cloud, on-prem)
- No forced migration
- Open standards (no proprietary formats)
- Export agents easily

### 3. True Multi-Agent Orchestration (vs. CrewAI's Python-Only)

**CrewAI**: Python-only, complex setup
**Sutradhar**: Language-agnostic, simple runtime model

```typescript
// Mix agents from different languages/runtimes
await orchestrator.register({
  id: 'python-agent',
  runtime: 'container',
  image: 'my-python-agent:latest'
});

await orchestrator.register({
  id: 'node-agent',
  runtime: 'in-process',
  implementation: NodeAgent
});

await orchestrator.register({
  id: 'http-agent',
  runtime: 'http',
  url: 'https://external-service.com'
});
```

### 4. Scalability Built-In (vs. LangChain's Scaling Challenges)

**LangChain**: Manual scaling, complex setup
**Sutradhar**: Auto-scaling, resource-aware

```typescript
// Automatic scaling based on load
await orchestrator.deploy('tutoring-agent', {
  autoScale: {
    minReplicas: 2,
    maxReplicas: 10,
    targetLoad: 0.7
  },
  resources: {
    cpu: '500m',
    memory: '512Mi'
  }
});
```

### 5. Security-First (vs. Kubiya's Niche Focus)

**Kubiya**: DevOps-focused, limited use cases
**Sutradhar**: Universal platform with zero-trust

- Per-agent authentication
- Resource isolation
- Network policies
- Audit logging
- Works for any domain (not just DevOps)

### 6. Cost-Effective (vs. Enterprise Pricing)

**Competitors**: High per-agent/user pricing
**Sutradhar**: Open-source, self-hostable, efficient

- No per-agent fees
- Self-hostable (no cloud vendor lock-in)
- Efficient resource utilization
- Community-driven development

## Architecture Decisions Based on Market Analysis

### Decision 1: Code-First with Optional UI

**Why**: Boomi's low-code limits flexibility. Developers need full control.
**Approach**: Primary API is code-based, UI is optional layer.

```typescript
// Primary: Code API
const agent = await orchestrator.register({...});

// Optional: UI for non-technical users
// UI generates code, not the other way around
```

### Decision 2: Multiple Runtime Support

**Why**: CrewAI/Pipecat focus on single runtime (Python/Process)
**Approach**: Support any runtime (in-process, HTTP, container, process)

### Decision 3: Vendor-Neutral Architecture

**Why**: Boomi's vendor lock-in is a major pain point
**Approach**: Open-source, portable agents, standard formats

### Decision 4: Built-in Observability

**Why**: LangChain and others require external tools
**Approach**: Built-in metrics, tracing, health checks

### Decision 5: Resource-Aware Orchestration

**Why**: Most platforms don't handle resource limits well
**Approach**: Kubernetes-like resource management (CPU, memory, rate limits)

### Decision 6: Type Safety First

**Why**: Python-based platforms lack type safety
**Approach**: TypeScript-first with strict types

## Implementation Priorities (Based on Market Gaps)

### Phase 1: Core Differentiators (Weeks 1-2)
1. ✅ Multi-runtime support (in-process, HTTP)
2. ✅ Type-safe agent interface
3. ✅ Basic orchestration API
4. ✅ Health monitoring

### Phase 2: Competitive Advantages (Weeks 3-4)
5. ✅ Container runtime
6. ✅ Auto-scaling
7. ✅ Observability (metrics, tracing)
8. ✅ Resource management

### Phase 3: Market Leadership (Weeks 5-6)
9. ✅ Zero-trust security
10. ✅ Agent marketplace
11. ✅ Developer tooling (CLI, SDKs)
12. ✅ Migration tools (from Boomi, CrewAI, etc.)

## Next Steps

1. **Design Review**: Validate orchestration architecture against market needs
2. **Phase 1 Implementation**: Core orchestrator + multi-runtime support
3. **Migration**: Wrap existing agents, demonstrate backward compatibility
4. **Testing**: Test with current agents and external HTTP agents
5. **Phase 2**: Add container runtime, auto-scaling, observability
6. **Documentation**: Developer-focused docs (vs. user-focused like Boomi)
7. **Phase 3**: Security, marketplace, tooling
8. **Community**: Open-source, examples, contributions

