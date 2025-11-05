/**
 * Sutradhar Orchestrator Server
 * Pure agent orchestration engine - agent agnostic
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { orchestratorRoutes } from './routes/orchestrator';
import { orchestrator } from './orchestrator/orchestrator';
import { initializePlugins } from './core/plugin-factory';
import { EmailAgent } from './agents/email-agent';
import { ActionAgent } from './agents/action-agent';
import { LLMAgent } from './agents/llm-agent';
import { RetrievalAgent } from './agents/retrieval-agent';
import { DataAgent } from './agents/data-agent';
import { log } from './log';

const app = express();
const PORT = process.env.PORT || process.env.SUTRADHAR_PORT || 5000;

// Middleware
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'sutradhar-orchestrator' });
});

// Orchestrator API
app.use('/orchestrator', orchestratorRoutes);

// Agent definitions
const agentDefinitions = [
  {
    id: 'email-agent',
    type: 'email',
    version: '1.0.0',
    runtime: 'in-process' as const,
    implementation: new EmailAgent(),
    capabilities: ['send', 'resolveInboxId'],
  },
  {
    id: 'action-agent',
    type: 'action',
    version: '1.0.0',
    runtime: 'in-process' as const,
    implementation: new ActionAgent(),
    capabilities: ['execute', 'listBySession'],
  },
  {
    id: 'llm-agent',
    type: 'llm',
    version: '1.0.0',
    runtime: 'in-process' as const,
    implementation: new LLMAgent(),
    capabilities: ['chat'],
  },
  {
    id: 'retrieval-agent',
    type: 'retrieval',
    version: '1.0.0',
    runtime: 'in-process' as const,
    implementation: new RetrievalAgent(),
    capabilities: ['search', 'index', 'getStatus'],
  },
  {
    id: 'data-agent',
    type: 'data',
    version: '1.0.0',
    runtime: 'in-process' as const,
    implementation: new DataAgent(),
    capabilities: ['query', 'mutation', 'batchQuery'],
  },
];

// Initialize plugins and register agents on startup
(async () => {
  try {
    await initializePlugins();
    log.info('Plugins initialized');

    // Register all agents
    for (const definition of agentDefinitions) {
      await orchestrator.registerAgent(definition);
    }

    log.info('Agents registered with orchestrator', {
      agents: agentDefinitions.map(a => a.id),
    });
  } catch (error) {
    log.error('Failed to initialize plugins or register agents', error);
    process.exit(1);
  }
})();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sutradhar Orchestrator running on port ${PORT}`);
  console.log(`📡 Orchestrator API: http://localhost:${PORT}/orchestrator`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export { app };
