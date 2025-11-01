/**
 * Logs API Routes
 * Session-based log search and retrieval
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, rateLimiters } from '../../core/middleware';
import { Convex } from '../../convexClient';
import { logger } from '../../core/logging/logger';

const router = Router();

/**
 * GET /api/v1/logs/sessions/recent
 * Get recent sessions with logs
 */
router.get(
  '/sessions/recent',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string | undefined;

    const sessions = await Convex.logs.recentSessions({ limit, userId });

    logger.info('Retrieved recent sessions with logs', {
      requestId: req.requestId,
      sessionCount: Array.isArray(sessions) ? sessions.length : 0,
      limit,
    });

    res.json({
      ok: true,
      sessions,
      count: Array.isArray(sessions) ? sessions.length : 0,
    });
  })
);

/**
 * GET /api/v1/logs/sessions/:sessionId
 * Get logs for a specific session
 */
router.get(
  '/sessions/:sessionId',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 1000;
    const level = req.query.level as string | undefined;
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;

    const logs = await Convex.logs.bySession({
      sessionId,
      limit,
      level,
      startTime,
      endTime,
    });

    logger.info('Retrieved logs for session', {
      requestId: req.requestId,
      sessionId,
      logCount: Array.isArray(logs) ? logs.length : 0,
      level,
    });

    res.json({
      ok: true,
      sessionId,
      logs,
      count: Array.isArray(logs) ? logs.length : 0,
    });
  })
);

/**
 * GET /api/v1/logs/sessions/:sessionId/stats
 * Get log statistics for a session
 */
router.get(
  '/sessions/:sessionId/stats',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const stats = await Convex.logs.sessionStats({ sessionId });

    logger.verbose('Retrieved log statistics', {
      requestId: req.requestId,
      sessionId,
    });

    res.json({
      ok: true,
      sessionId,
      stats,
    });
  })
);

/**
 * GET /api/v1/logs/search
 * Search logs across all sessions
 */
router.get(
  '/search',
  rateLimiters.lenient,
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        ok: false,
        error: 'Missing query parameter "q"',
      });
    }

    const level = req.query.level as string | undefined;
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    // Default to last 30 days if no time range specified
    const defaultStartTime = startTime || Date.now() - 30 * 24 * 60 * 60 * 1000;

    const logs = await Convex.logs.search({
      query,
      level,
      startTime: defaultStartTime,
      endTime,
      limit,
    });

    logger.info('Searched logs', {
      requestId: req.requestId,
      query,
      resultCount: Array.isArray(logs) ? logs.length : 0,
      level,
    });

    res.json({
      ok: true,
      query,
      logs,
      count: Array.isArray(logs) ? logs.length : 0,
    });
  })
);

/**
 * GET /api/v1/logs/most-recent
 * Get logs from the most recent session with logs
 */
router.get(
  '/most-recent',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as string | undefined;

    // Get most recent session
    const sessions = await Convex.logs.recentSessions({ limit: 1 });
    
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.json({
        ok: true,
        message: 'No sessions with logs found',
        logs: [],
        count: 0,
      });
    }

    const mostRecentSession = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
    const logs = await Convex.logs.bySession({
      sessionId: mostRecentSession.sessionId,
      limit,
      level,
    });

    logger.info('Retrieved logs from most recent session', {
      requestId: req.requestId,
      sessionId: mostRecentSession.sessionId,
      logCount: Array.isArray(logs) ? logs.length : 0,
    });

    res.json({
      ok: true,
      session: mostRecentSession,
      logs,
      count: Array.isArray(logs) ? logs.length : 0,
    });
  })
);

export default router;

