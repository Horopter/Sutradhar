/**
 * Collaboration API
 * UI-focused endpoints for issues, tasks, and collaboration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { unifiedActionService } from '../../services/action-service';
import { logger } from '../../core/logging/logger';
import { Task, Issue, Event } from '../../models/action';

const router = Router();

// Validation schemas
const CreateIssueSchema = z.object({
  repository: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const CreateEventSchema = z.object({
  calendar: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

/**
 * POST /api/v1/issues
 * Create a GitHub issue
 */
router.post('/issues',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: CreateIssueSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { repository, title, description, labels, priority } = req.body;
    const log = (req as any).logger || logger.child({ service: 'collaboration', action: 'createIssue' });

    log.info('Create issue', { repository, title });

    try {
      const issue: Issue = {
        type: 'issue',
        title,
        description,
        status: 'pending',
        priority,
        repository,
        labels,
      };

      const result = await unifiedActionService.createTask(issue);

      res.status(result.success ? 201 : 500).json({
        ok: result.success,
        result,
      });
    } catch (error: any) {
      log.error('Create issue failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create issue',
      });
    }
  })
);

/**
 * GET /api/unified/collaboration/issues
 * List issues (requires repository query param)
 */
router.get('/issues',
  rateLimiters.standard,
  validate({ query: z.object({
    repository: z.string(),
    state: z.enum(['open', 'closed', 'all']).optional().default('open'),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { repository } = req.query;
    const log = (req as any).logger || logger.child({ service: 'collaboration', action: 'listIssues' });

    try {
      // Delegate to GitHub integration
      const { listGithubIssues } = await import('../../integrations/actions/github');
      const [owner, repo] = (repository as string).split('/');
      
      if (!owner || !repo) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid repository format. Use owner/repo',
        });
      }

      const result: any = await listGithubIssues(owner, repo);
      const issues = Array.isArray(result) ? result : (result.issues || []);

      res.json({
        ok: true,
        issues,
        count: issues.length,
      });
    } catch (error: any) {
      log.error('List issues failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list issues',
      });
    }
  })
);

/**
 * GET /api/unified/collaboration/issues/:issueId
 * Get a specific issue
 */
router.get('/issues/:issueId',
  rateLimiters.standard,
  validate({ query: z.object({
    repository: z.string(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { issueId: id } = req.params;
    const { repository } = req.query;
    const log = (req as any).logger || logger.child({ service: 'collaboration', action: 'getIssue' });

    try {
      const issue = await unifiedActionService.getTask(id, 'issue', { repository: repository as string });

      if (!issue) {
        return res.status(404).json({
          ok: false,
          error: 'Issue not found',
        });
      }

      res.json({
        ok: true,
        issue,
      });
    } catch (error: any) {
      log.error('Get issue failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get issue',
      });
    }
  })
);

/**
 * PUT /api/unified/collaboration/issues/:issueId
 * Update an issue
 */
router.put('/issues/:issueId',
  rateLimiters.standard,
  timeouts.standard,
  validate({
    query: z.object({
      repository: z.string(),
    }),
    body: UpdateTaskSchema,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { issueId: id } = req.params;
    const { repository } = req.query;
    const updates = req.body;
    const log = (req as any).logger || logger.child({ service: 'collaboration', action: 'updateIssue' });

    try {
      // Get existing issue first
      const existing = await unifiedActionService.getTask(id, 'issue', { repository: repository as string });
      
      if (!existing) {
        return res.status(404).json({
          ok: false,
          error: 'Issue not found',
        });
      }

      const result = await unifiedActionService.updateTask(id, existing as any, updates);

      res.json({
        ok: result.success,
        result,
      });
    } catch (error: any) {
      log.error('Update issue failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to update issue',
      });
    }
  })
);

/**
 * POST /api/v1/tasks
 * Create a task (issue or event)
 */
router.post('/tasks',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: z.union([CreateIssueSchema.extend({ type: z.literal('issue') }), CreateEventSchema.extend({ type: z.literal('event') })]) }),
  asyncHandler(async (req: Request, res: Response) => {
    const task = req.body;
    const log = (req as any).logger || logger.child({ service: 'collaboration', action: 'createTask' });

    try {
      const taskObj = task.type === 'issue' 
        ? { ...task, status: 'pending' as const } as Issue
        : { ...task, status: 'pending' as const } as Event;

      const result = await unifiedActionService.createTask(taskObj);

      res.status(result.success ? 201 : 500).json({
        ok: result.success,
        result,
      });
    } catch (error: any) {
      log.error('Create task failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create task',
      });
    }
  })
);

export { router as collaborationRoutes };

