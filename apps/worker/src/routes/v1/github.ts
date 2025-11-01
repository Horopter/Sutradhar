/**
 * GitHub RESTful API Routes
 * Complete CRUD operations for GitHub resources
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { 
  createGithubIssue,
  getGithubRepo, 
  listGithubIssues, 
  getGithubIssue, 
  updateGithubIssue, 
  addGithubIssueComment 
} from '../../integrations/actions/github';
import { logger } from '../../core/logging/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateIssueSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional().default(''),
  repoSlug: z.string().optional(),
  sessionId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

const UpdateIssueSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

const CreatePRSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional().default(''),
  head: z.string().min(1), // branch name
  base: z.string().optional().default('main'),
  repoSlug: z.string().optional(),
  sessionId: z.string().optional(),
  draft: z.boolean().optional().default(false),
});

const RepoSchema = z.object({
  repoSlug: z.string().optional(),
});

/**
 * POST /api/v1/github/issues
 * Create a new issue (convenience endpoint without repo in path)
 */
router.post(
  '/issues',
  rateLimiters.standard,
  validate({ body: CreateIssueSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    // Validation already handled by middleware, body is parsed
    const p = req.body;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'create-issue' });
    
    log.verbose('Create issue', { title: p.title });
    
    try {
      const result = await createGithubIssue(p.title, p.body || '', p.repoSlug);
      const issueNumber = (result as any)?.number || (result as any)?.data?.number;
      log.info('Created issue', { number: issueNumber });
      res.json({
        ok: true,
        issue: result,
      });
    } catch (error: any) {
      log.error('Failed to create issue', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create issue',
      });
    }
  })
);

/**
 * GET /api/v1/github/repos/:owner/:repo
 * Get repository information
 */
router.get(
  '/repos/:owner/:repo',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'get-repo' });
    
    log.verbose('Get repository', { owner, repo });
    
    try {
      const result = await getGithubRepo(owner, repo);
      log.info('Retrieved repository', { owner, repo });
      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      log.error('Failed to get repository', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get repository',
      });
    }
  })
);

/**
 * GET /api/v1/github/repos/:owner/:repo/issues
 * List issues for a repository
 */
router.get(
  '/repos/:owner/:repo/issues',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const { state, label, assignee, limit } = req.query;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'list-issues' });
    
    log.verbose('List issues', { owner, repo, state, label, assignee });
    
    try {
      const result = await listGithubIssues(owner, repo, {
        state: (state as any) || 'open',
        labels: label ? [label as string] : undefined,
        assignee: assignee as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      const issues = (result as any)?.data || (Array.isArray(result) ? result : []);
      log.info('Retrieved issues', { owner, repo, count: Array.isArray(issues) ? issues.length : 0 });
      
      res.json({
        ok: true,
        data: {
          repoSlug: `${owner}/${repo}`,
          issues: Array.isArray(issues) ? issues : [],
          count: Array.isArray(issues) ? issues.length : 0,
        },
      });
    } catch (error: any) {
      log.error('Failed to list issues', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list issues',
      });
    }
  })
);

/**
 * POST /api/v1/github/repos/:repoSlug/issues
 * Create a new issue
 */
router.post(
  '/repos/:repoSlug/issues',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CreateIssueSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { repoSlug } = req.params;
    const data = CreateIssueSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ 
      service: 'github', 
      action: 'create-issue',
      repoSlug,
      sessionId: data.sessionId,
    });
    
    log.info('Creating GitHub issue', { 
      title: data.title.substring(0, 50),
      repoSlug: repoSlug || data.repoSlug,
    });
    
    const finalRepoSlug = repoSlug || data.repoSlug;
    if (!finalRepoSlug) {
      return res.status(400).json({
        ok: false,
        error: 'Repository slug required',
        message: 'Provide repoSlug in path or body',
      });
    }
    
    try {
      const result = await createGithubIssue(data.title, data.body || '', finalRepoSlug);
      
      log.info('GitHub issue created', {
        issueNumber: (result as any)?.data?.number,
        url: (result as any)?.data?.html_url,
      });
      
      res.status(201).json({
        ok: true,
        data: result,
        message: 'Issue created successfully',
      });
    } catch (error: any) {
      log.error('Failed to create issue', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create issue',
      });
    }
  })
);

/**
 * GET /api/v1/github/repos/:owner/:repo/issues/:issueNumber
 * Get a specific issue
 */
router.get(
  '/repos/:owner/:repo/issues/:issueNumber',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'get-issue' });
    
    log.verbose('Get issue', { owner, repo, issueNumber });
    
    const issueNum = parseInt(issueNumber);
    if (isNaN(issueNum)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid issue number',
        message: 'Issue number must be a number',
      });
    }
    
    try {
      const result = await getGithubIssue(owner, repo, issueNum);
      log.info('Retrieved issue', { owner, repo, issueNumber });
      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      log.error('Failed to get issue', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get issue',
      });
    }
  })
);

/**
 * PATCH /api/v1/github/repos/:owner/:repo/issues/:issueNumber
 * Update an issue
 */
router.patch(
  '/repos/:owner/:repo/issues/:issueNumber',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: UpdateIssueSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const data = UpdateIssueSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ service: 'github', action: 'update-issue' });
    
    log.info('Update issue', { owner, repo, issueNumber, updates: Object.keys(data) });
    
    const issueNum = parseInt(issueNumber);
    if (isNaN(issueNum)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid issue number',
        message: 'Issue number must be a number',
      });
    }
    
    try {
      const result = await updateGithubIssue(owner, repo, issueNum, {
        title: data.title,
        body: data.body,
        state: data.state,
        labels: data.labels,
        assignees: data.assignees,
      });
      
      log.info('Issue updated', { owner, repo, issueNumber });
      res.json({
        ok: true,
        data: result,
        message: 'Issue updated successfully',
      });
    } catch (error: any) {
      log.error('Failed to update issue', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to update issue',
      });
    }
  })
);

/**
 * POST /api/v1/github/repos/:owner/:repo/issues/:issueNumber/comments
 * Add a comment to an issue
 */
router.post(
  '/repos/:owner/:repo/issues/:issueNumber/comments',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: z.object({ body: z.string().min(1), sessionId: z.string().optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const { body: commentBody, sessionId } = req.body;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'add-comment' });
    
    log.info('Add comment to issue', { owner, repo, issueNumber });
    
    const issueNum = parseInt(issueNumber);
    if (isNaN(issueNum)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid issue number',
        message: 'Issue number must be a number',
      });
    }
    
    try {
      const result = await addGithubIssueComment(owner, repo, issueNum, commentBody);
      log.info('Comment added', { owner, repo, issueNumber });
      res.status(201).json({
        ok: true,
        data: result,
        message: 'Comment added successfully',
      });
    } catch (error: any) {
      log.error('Failed to add comment', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to add comment',
      });
    }
  })
);

/**
 * GET /api/v1/github/repos/:repoSlug/pulls
 * List pull requests
 */
router.get(
  '/repos/:repoSlug/pulls',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoSlug } = req.params;
    const { state, limit } = req.query;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'list-pulls' });
    
    log.verbose('List pull requests', { repoSlug, state });
    
    // TODO: Implement PR listing via Composio
    res.status(501).json({
      ok: false,
      error: 'Not implemented',
      message: 'Pull request listing coming soon',
    });
  })
);

/**
 * POST /api/v1/github/repos/:repoSlug/pulls
 * Create a pull request
 */
router.post(
  '/repos/:repoSlug/pulls',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CreatePRSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { repoSlug } = req.params;
    const data = CreatePRSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ service: 'github', action: 'create-pr' });
    
    log.info('Create pull request', { 
      repoSlug: repoSlug || data.repoSlug,
      head: data.head,
      base: data.base,
    });
    
    // TODO: Implement PR creation via Composio
    res.status(501).json({
      ok: false,
      error: 'Not implemented',
      message: 'Pull request creation coming soon',
    });
  })
);

/**
 * GET /api/v1/github/repos/:repoSlug/pulls/:prNumber
 * Get a specific pull request
 */
router.get(
  '/repos/:repoSlug/pulls/:prNumber',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoSlug, prNumber } = req.params;
    const log = (req as any).logger || logger.child({ service: 'github', action: 'get-pr' });
    
    log.verbose('Get pull request', { repoSlug, prNumber });
    
    // TODO: Implement PR retrieval via Composio
    res.status(501).json({
      ok: false,
      error: 'Not implemented',
      message: 'Pull request retrieval coming soon',
    });
  })
);

export default router;

