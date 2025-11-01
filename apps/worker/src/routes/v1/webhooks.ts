/**
 * Webhooks API Routes
 * Incoming event handlers for Slack, GitHub, Calendar
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware';
import { handleSlackWebhook } from '../../integrations/webhooks/slack';
import { handleGitHubWebhook } from '../../integrations/webhooks/github';
import { handleCalendarWebhook } from '../../integrations/webhooks/calendar';
import { logger } from '../../core/logging/logger';

const router = Router();

/**
 * POST /api/v1/webhooks/slack
 * Slack Events API webhook
 */
router.post(
  '/slack',
  asyncHandler(async (req: Request, res: Response) => {
    await handleSlackWebhook(req, res);
  })
);

/**
 * POST /api/v1/webhooks/github
 * GitHub webhook
 */
router.post(
  '/github',
  asyncHandler(async (req: Request, res: Response) => {
    await handleGitHubWebhook(req, res);
  })
);

/**
 * POST /api/v1/webhooks/calendar/:calendarId?
 * Google Calendar webhook
 */
router.post(
  '/calendar/:calendarId?',
  asyncHandler(async (req: Request, res: Response) => {
    await handleCalendarWebhook(req, res);
  })
);

/**
 * GET /api/v1/webhooks
 * List available webhooks
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      ok: true,
      webhooks: [
        {
          service: 'slack',
          endpoint: '/api/v1/webhooks/slack',
          description: 'Slack Events API webhook for receiving messages and responding',
          events: ['message'],
        },
        {
          service: 'github',
          endpoint: '/api/v1/webhooks/github',
          description: 'GitHub webhook for issue comments and events',
          events: ['issue_comment', 'issues'],
        },
        {
          service: 'calendar',
          endpoint: '/api/v1/webhooks/calendar/:calendarId',
          description: 'Google Calendar webhook for event changes',
          events: ['event.created', 'event.updated', 'event.deleted'],
        },
      ],
    });
  })
);

export default router;

