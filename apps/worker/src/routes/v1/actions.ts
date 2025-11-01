/**
 * Actions API Routes
 * External service integration endpoints (Slack, Calendar, GitHub, Forum)
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { actionService } from '../../core/services/action-service';
import { sessionService } from '../../core/services/session-service';
import { z } from 'zod';

const router = Router();

const SlackSchema = z.object({
  text: z.string().min(1),
  channelId: z.string().optional(),
  sessionId: z.string().optional()
});

const CalendarSchema = z.object({
  title: z.string().min(1),
  startISO: z.string().min(1),
  endISO: z.string().min(1),
  description: z.string().optional(),
  calendarId: z.string().optional(),
  sessionId: z.string().optional()
});

const GitHubSchema = z.object({
  title: z.string().min(1),
  body: z.string().default(""),
  repoSlug: z.string().optional(),
  sessionId: z.string().optional()
});

const ForumSchema = z.object({
  url: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  text: z.string().min(1),
  sessionId: z.string().optional()
});

/**
 * POST /api/v1/actions/slack
 * Send message to Slack channel
 */
router.post('/slack',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SlackSchema }),
  asyncHandler(async (req, res) => {
    const p = SlackSchema.parse(req.body);
    const result = await actionService.executeAction('slack', p);
    
    // TODO: Record action metrics via metrics service
    
    if (result.ok && result.data && p.sessionId && !result.mocked) {
      const permalink = (result.data as any)?.data?.permalink || (result.data as any)?.data?.message?.permalink;
      const message = permalink ? `Posted to Slack ✅ ${permalink}` : "Posted to Slack ✅";
      await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
    }
    
    res.json({
      ...result,
      message: result.ok ? 'Slack message sent successfully.' : undefined
    });
  })
);

/**
 * POST /api/v1/actions/calendar
 * Create Google Calendar event
 */
router.post('/calendar',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CalendarSchema }),
  asyncHandler(async (req, res) => {
    const p = CalendarSchema.parse(req.body);
    const result = await actionService.executeAction('calendar', p);
    
    // TODO: Record action metrics via metrics service
    
    if (result.ok && result.data && p.sessionId && !result.mocked) {
      const htmlLink = (result.data as any)?.data?.htmlLink;
      const message = htmlLink ? `Created calendar event ✅ ${htmlLink}` : `Created calendar event ✅ "${p.title}"`;
      await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
    }
    
    res.json({
      ...result,
      message: result.ok ? 'Calendar event created successfully.' : undefined
    });
  })
);

/**
 * POST /api/v1/actions/github
 * Create GitHub issue
 */
router.post('/github',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: GitHubSchema }),
  asyncHandler(async (req, res) => {
    const p = GitHubSchema.parse(req.body);
    const result = await actionService.executeAction('github', p);
    
    // TODO: Record action metrics via metrics service
    
    if (result.ok && result.data && p.sessionId && !result.mocked) {
      const htmlUrl = (result.data as any)?.data?.html_url || (result.data as any)?.data?.url;
      const issueNum = (result.data as any)?.data?.number;
      const message = htmlUrl ? `Created GitHub issue ✅ #${issueNum || 'N/A'} ${htmlUrl}` : `Created GitHub issue ✅ "${p.title}"`;
      await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
    }
    
    res.json({
      ...result,
      message: result.ok ? 'GitHub issue created successfully.' : undefined
    });
  })
);

/**
 * POST /api/v1/actions/forum
 * Post to forum (browser automation)
 */
router.post('/forum',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: ForumSchema }),
  asyncHandler(async (req, res) => {
    const p = ForumSchema.parse(req.body);
    const result = await actionService.executeAction('forum', p);
    
    if (result.ok && p.sessionId) {
      const data = result.data as any;
      await sessionService.appendMessage(
        p.sessionId,
        "agent",
        result.mocked ? `Mocked forum post ✅` : `Posted to forum ✅`,
        [{ type: "screenshot", id: data?.screenshot || '', title: "Forum screenshot", url: data?.url || '' }],
        0
      );
    }
    
    res.status(result.ok ? 200 : 500).json({
      ...result,
      message: result.ok ? 'Forum post created successfully.' : undefined
    });
  })
);

/**
 * GET /api/v1/actions?sessionId=<id>
 * List actions by session
 */
router.get('/',
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(async (req, res) => {
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: "sessionId required" });
    }
    
    const actions = await actionService.getActionsBySession(sessionId);
    res.json({
      ok: true,
      sessionId,
      actions,
      message: `Found ${actions.length} action(s) for this session.`
    });
  })
);

export { router as actionRoutes };

