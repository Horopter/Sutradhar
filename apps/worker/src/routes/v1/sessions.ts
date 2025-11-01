/**
 * Sessions API Routes
 * Session management endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { sessionService } from '../../core/services/session-service';
import { logger } from '../../core/logging/logger';
import { z } from 'zod';

const router = Router();

const StartSessionSchema = z.object({
  channel: z.string().optional().default('web'),
  persona: z.string().optional().default('Greeter'),
  userName: z.string().optional(),
});

const EndSessionSchema = z.object({
  sessionId: z.string().min(1),
});

const ListSessionsSchema = z.object({
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

/**
 * POST /api/v1/sessions/start
 * Start a new session
 */
router.post('/start',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: StartSessionSchema }),
  asyncHandler(async (req, res) => {
    const p = StartSessionSchema.parse(req.body);
    const log = logger.child({ service: 'sessions', action: 'start' });
    
    log.verbose('Starting session', { channel: p.channel, persona: p.persona });
    
    const session = await sessionService.createSession(
      p.channel!,
      p.persona!,
      p.userName || 'Anonymous',
    );
    
    if (!session) {
      log.error('Failed to create session');
      return res.status(500).json({
        ok: false,
        error: 'Failed to create session',
      });
    }
    
    log.info('Session started', { sessionId: session.sessionId });
    
    res.json({
      ok: true,
      sessionId: session.sessionId,
      channel: session.channel,
      persona: session.persona,
      createdAt: session.startedAt || Date.now(),
    });
  })
);

/**
 * POST /api/v1/sessions/end
 * End a session
 */
router.post('/end',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: EndSessionSchema }),
  asyncHandler(async (req, res) => {
    const p = EndSessionSchema.parse(req.body);
    const log = logger.child({ service: 'sessions', action: 'end' });
    
    log.verbose('Ending session', { sessionId: p.sessionId });
    
    await sessionService.endSession(p.sessionId);
    
    log.info('Session ended', { sessionId: p.sessionId });
    
    res.json({
      ok: true,
      sessionId: p.sessionId,
      message: 'Session ended successfully',
    });
  })
);

/**
 * GET /api/v1/sessions/list
 * List sessions
 */
router.get('/list',
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const log = logger.child({ service: 'sessions', action: 'list' });
    
    log.verbose('Listing sessions', { limit, offset });
    
    const allSessions = await sessionService.listSessions();
    const sessions = allSessions.slice(offset, offset + limit);
    
    log.info('Sessions listed', { count: sessions.length });
    
    res.json({
      ok: true,
      sessions,
      count: sessions.length,
    });
  })
);

/**
 * GET /api/v1/sessions/:sessionId
 * Get session details and messages
 */
router.get('/:sessionId',
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const log = logger.child({ service: 'sessions', action: 'get', sessionId });
    
    log.verbose('Getting session', { sessionId });
    
    // Get session messages
    const messages = await sessionService.getMessages(sessionId);
    
    log.info('Session retrieved', { sessionId, messageCount: messages.length });
    
    res.json({
      ok: true,
      sessionId,
      messages,
      count: messages.length,
    });
  })
);

export { router as sessionRoutes };

