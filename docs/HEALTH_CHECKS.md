# Health Checks & Integration Testing Guide

This document describes the health check and integration testing strategy for the three-layer architecture.

## Architecture Layers

```
Masterbolt (Frontend - Port 3777)
    ↓ HTTP
Optimus (Backend Agents - Port 4001)
    ↓ HTTP (SutradharClient)
Sutradhar (Orchestrator - Port 5000)
    ├── email-agent
    ├── action-agent
    ├── llm-agent
    ├── retrieval-agent
    └── data-agent
```

## Health Check Levels

### Level 1: Sutradhar Server Health

**Endpoint**: `GET /health`

**Test**: Basic server health check

```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "ok": true,
  "service": "sutradhar-orchestrator"
}
```

### Level 2: Agent Health Checks (Sutradhar)

**Endpoint**: `GET /orchestrator/agents/:id/health`

**Test**: Check health of each registered agent

```bash
# Check all agents
for agent in email-agent action-agent llm-agent retrieval-agent data-agent; do
  curl http://localhost:5000/orchestrator/agents/$agent/health
done
```

**Expected Response**:
```json
{
  "ok": true,
  "health": {
    "status": "healthy",
    "lastCheck": 1234567890
  }
}
```

**Agent Health Statuses**:
- `healthy`: Agent is operational
- `degraded`: Agent is partially operational (e.g., Convex not available for data-agent)
- `unhealthy`: Agent is not operational

### Level 3: Agent Registration & Listing

**Endpoint**: `GET /orchestrator/agents`

**Test**: Verify all agents are registered

```bash
curl http://localhost:5000/orchestrator/agents
```

**Expected Response**:
```json
{
  "ok": true,
  "agents": [
    {
      "id": "email-agent",
      "type": "email",
      "runtime": "in-process"
    },
    {
      "id": "action-agent",
      "type": "action",
      "runtime": "in-process"
    },
    // ... more agents
  ]
}
```

### Level 4: Agent Task Execution (Sutradhar)

**Endpoint**: `POST /orchestrator/tasks/execute`

**Test**: Execute tasks via agents

#### Test LLM Agent

```bash
curl -X POST http://localhost:5000/orchestrator/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "llm-agent",
    "task": {
      "type": "chat",
      "payload": {
        "system": "You are a test assistant.",
        "user": "Say hello",
        "provider": "openai",
        "model": "gpt-4o-mini"
      }
    }
  }'
```

#### Test Data Agent

```bash
curl -X POST http://localhost:5000/orchestrator/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "data-agent",
    "task": {
      "type": "query",
      "payload": {
        "path": "sessions:list",
        "args": {}
      }
    }
  }'
```

**Expected Response**:
```json
{
  "ok": true,
  "success": true,
  "data": { ... },
  "metadata": {
    "latency": 123,
    "agentId": "llm-agent",
    "version": "1.0.0"
  }
}
```

### Level 5: Optimus → Sutradhar Integration

**Endpoint**: `GET /health`

**Test**: Verify Optimus can connect to Sutradhar

```bash
curl http://localhost:4001/health
```

**Expected Response**:
```json
{
  "ok": true,
  "service": "optimus",
  "sutradharConnected": true,
  "agentsCount": 5
}
```

### Level 6: Optimus Agent Endpoints

**Endpoints**:
- `GET /agents` - List Optimus agents
- `GET /catalog` - Test catalog endpoint

**Test**: Verify Optimus agents are accessible

```bash
# List Optimus agents
curl http://localhost:4001/agents

# Test catalog
curl http://localhost:4001/catalog
```

**Expected Response** (`/agents`):
```json
{
  "ok": true,
  "agents": [
    {
      "name": "AuthAgent",
      "description": "Handles user authentication",
      "type": "AuthAgent"
    },
    // ... more agents
  ]
}
```

### Level 7: Masterbolt → Optimus Integration

**Endpoint**: `GET /` (root)

**Test**: Verify Masterbolt can reach Optimus

```bash
curl http://localhost:3000
```

**Expected**: HTML page loads successfully

## Running Health Checks

### Using the Bash Script

```bash
bash scripts/run-health-checks.sh
```

### Using the Node.js Script

```bash
node scripts/test-integration.js
```

### Manual Testing

1. **Start all services**:
   ```bash
   # Terminal 1: Sutradhar
   cd apps/sutradhar && npm run dev
   
   # Terminal 2: Optimus
   cd apps/optimus && npm run dev
   
   # Terminal 3: Masterbolt
   cd apps/masterbolt && pnpm dev
   ```

2. **Run health checks**:
   ```bash
   bash scripts/run-health-checks.sh
   ```

## Troubleshooting

### Sutradhar Not Running

**Symptom**: `curl: (7) Failed to connect to localhost port 5000`

**Solution**:
```bash
cd apps/sutradhar
npm install
npm run dev
```

### Optimus Cannot Connect to Sutradhar

**Symptom**: `"sutradharConnected": false`

**Solution**:
1. Verify Sutradhar is running on port 5000
2. Check `SUTRADHAR_URL` environment variable in Optimus
3. Verify network connectivity

### Agents Not Registered

**Symptom**: Empty agents list or agent not found

**Solution**:
1. Check Sutradhar server logs for registration errors
2. Verify all agent implementations are correct
3. Check for TypeScript compilation errors

### Agent Health Checks Failing

**Symptom**: Agent health status is `unhealthy`

**Solution**:
- **data-agent**: Check if Convex is running and `CONVEX_URL` is set
- **llm-agent**: Check if `OPENAI_API_KEY` is set (or mock mode is enabled)
- **retrieval-agent**: Check if retrieval services are configured
- **action-agent**: Check if `RUBE_API_KEY` or `COMPOSIO_API_KEY` is set
- **email-agent**: Check if `AGENTMAIL_API_KEY` is set

## Continuous Integration

Health checks can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Health Checks
  run: |
    npm run start:sutradhar &
    npm run start:optimus &
    sleep 10
    bash scripts/run-health-checks.sh
```

## Monitoring

For production, consider:
- Setting up monitoring dashboards (e.g., Grafana)
- Alerting on health check failures
- Logging health check results
- Tracking agent performance metrics

