/**
 * Voice API Routes
 * LiveKit voice integration endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts } from '../../core/middleware';
import { tokenRoute } from '../../voice/token';

const router = Router();

/**
 * GET /api/v1/voice/token
 * Generate LiveKit access token
 */
router.get('/token',
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(tokenRoute)
);

export { router as voiceRoutes };

