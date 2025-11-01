/**
 * Media API
 * UI-focused endpoints for images and voice
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { mediaService } from '../../services/media-service';
import { logger } from '../../core/logging/logger';

const router = Router();

const ImageSearchSchema = z.object({
  query: z.string().optional(),
  image: z.object({
    url: z.string().url().optional(),
    base64: z.string().optional(),
  }).optional(),
  maxResults: z.number().int().min(1).max(100).optional().default(10),
});

const IndexImageSchema = z.object({
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url().optional(),
    base64: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
  })).min(1),
});

const VoiceSessionSchema = z.object({
  userId: z.string(),
  roomName: z.string().optional(),
});

/**
 * POST /api/v1/media/images/search
 * Search images
 */
router.post('/images/search',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: ImageSearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.body;
    const results = await mediaService.searchImages(query);
    res.json({ ok: true, results });
  })
);

/**
 * POST /api/v1/media/images/index
 * Index images
 */
router.post('/images/index',
  rateLimiters.strict,
  timeouts.indexing,
  validate({ body: IndexImageSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { images } = req.body;
    await mediaService.indexImage(images);
    res.json({ ok: true, indexed: images.length });
  })
);

/**
 * POST /api/v1/media/voice/session
 * Start voice session
 */
router.post('/voice/session',
  rateLimiters.standard,
  validate({ body: VoiceSessionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const session = await mediaService.startVoiceSession(req.body);
    res.json({ ok: true, session });
  })
);

/**
 * GET /api/v1/media/voice/token
 * Get voice token
 */
router.get('/voice/token',
  rateLimiters.standard,
  validate({ query: z.object({
    sessionId: z.string(),
    userId: z.string(),
    roomName: z.string().optional(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, userId, roomName } = req.query;
    const token = await mediaService.generateVoiceToken(sessionId as string, userId as string, roomName as string);
    res.json({ ok: true, token });
  })
);

export { router as mediaRoutes };

