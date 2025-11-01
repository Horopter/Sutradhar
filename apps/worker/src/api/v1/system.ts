/**
 * System API
 * Health, auth, and system endpoints
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, rateLimiters } from '../../core/middleware';
import { healthMonitor } from '../../core/services/health-monitor';
import { logger } from '../../core/logging/logger';

const router = Router();

/**
 * GET /api/v1/system/health
 * System health check
 */
router.get('/health',
  rateLimiters.lenient,
  asyncHandler(async (req: Request, res: Response) => {
    const health = healthMonitor.getHeartbeatStatus();
    res.json({
      ok: health.overallHealth,
      health,
    });
  })
);

/**
 * GET /api/v1/system/capabilities
 * Get available capabilities
 */
router.get('/capabilities',
  rateLimiters.lenient,
  asyncHandler(async (req: Request, res: Response) => {
    const { mediaService } = await import('../../services/media-service');
    
    res.json({
      ok: true,
      capabilities: {
        conversations: true,
        knowledge: true,
        communications: true,
        collaboration: true,
        scheduling: true,
        images: mediaService.isImageSearchAvailable(),
        voice: mediaService.isVoiceAvailable(),
      },
    });
  })
);

export { router as systemRoutes };

