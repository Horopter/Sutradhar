/**
 * Orchestrator API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orchestrator } from '../orchestrator/orchestrator';
import { AgentDefinition, AgentTask } from '../orchestrator/types';
import { randomBytes } from 'crypto';

function nanoid(size = 21) {
  return randomBytes(size).toString('base64url').slice(0, size);
}

const router = Router();

// Register agent
router.post('/agents/register', async (req: Request, res: Response) => {
  try {
    const definition = req.body as AgentDefinition;
    
    // Validate required fields
    if (!definition.id || !definition.type || !definition.runtime) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: id, type, runtime',
      });
    }

    const handle = await orchestrator.registerAgent(definition);
    res.json({
      ok: true,
      agent: {
        id: handle.id,
        type: handle.type,
        runtime: handle.runtime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to register agent',
    });
  }
});

// List agents
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = orchestrator.listAgents();
    res.json({
      ok: true,
      agents: agents.map(agent => ({
        id: agent.id,
        type: agent.type,
        runtime: agent.runtime,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to list agents',
    });
  }
});

// Get agent by ID
router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = orchestrator.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({
        ok: false,
        error: 'Agent not found',
      });
    }

    res.json({
      ok: true,
      agent: {
        id: agent.id,
        type: agent.type,
        runtime: agent.runtime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to get agent',
    });
  }
});

// Execute task
router.post('/tasks/execute', async (req: Request, res: Response) => {
  try {
    const { agentId, task } = req.body;

    if (!agentId || !task) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: agentId, task',
      });
    }

    // Add task ID if not provided
    if (!task.id) {
      task.id = nanoid();
    }

    const result = await orchestrator.executeTask(agentId, task as AgentTask);
    
    res.status(result.success ? 200 : 500).json({
      ok: result.success,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to execute task',
    });
  }
});

// Check agent health
router.get('/agents/:id/health', async (req: Request, res: Response) => {
  try {
    const health = await orchestrator.checkHealth(req.params.id);
    res.json({
      ok: true,
      health,
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to check health',
    });
  }
});

export { router as orchestratorRoutes };

