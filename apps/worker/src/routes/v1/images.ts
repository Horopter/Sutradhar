/**
 * Image Search API Routes
 * Moss-powered image indexing and semantic search
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { mossImageService } from '../../integrations/images/moss-image-service';
import { logger } from '../../core/logging/logger';

const router = Router();

// Validation schemas
const IndexImageSchema = z.object({
  images: z.array(z.object({
    id: z.string().optional(),
    image: z.string().optional(), // base64 data URL
    imageUrl: z.string().optional(), // HTTP URL
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      url: z.string().optional(),
    }).passthrough().optional(),
  })).min(1),
});

const SearchImagesSchema = z.object({
  query: z.string().min(1).optional(),
  image: z.string().optional(), // base64 data URL for similarity search
  maxResults: z.number().int().min(1).max(100).optional().default(10),
});

/**
 * GET /api/v1/images/health
 * Check if image search service is available
 */
router.get('/health',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const available = mossImageService.isAvailable();
    res.json({
      ok: available,
      available,
      service: 'moss',
      message: available 
        ? 'Image search service is available' 
        : 'Image search service is not configured (missing MOSS_PROJECT_ID or MOSS_PROJECT_KEY)'
    });
  })
);

/**
 * POST /api/v1/images/index
 * Index images for search
 */
router.post('/index',
  rateLimiters.strict,
  timeouts.indexing,
  validate({ body: IndexImageSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { images } = req.body;
    const log = (req as any).logger || logger.child({ service: 'images', action: 'index' });

    if (!mossImageService.isAvailable()) {
      return res.status(503).json({
        ok: false,
        error: 'Image search service is not available',
        message: 'MOSS_PROJECT_ID and MOSS_PROJECT_KEY must be configured'
      });
    }

    try {
      // Ensure index exists
      await mossImageService.ensureIndex();

      // Index images
      const result = await mossImageService.indexImages(images);

      log.info('Images indexed', { 
        indexed: result.indexed, 
        total: result.total 
      });

      res.json({
        ok: true,
        indexed: result.indexed,
        total: result.total,
        message: `Successfully indexed ${result.indexed} image(s)`
      });
    } catch (error: any) {
      log.error('Failed to index images', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to index images'
      });
    }
  })
);

/**
 * POST /api/v1/images/search
 * Search images by text query or image similarity
 */
router.post('/search',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: SearchImagesSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { query, image, maxResults = 10 } = req.body;
    const log = (req as any).logger || logger.child({ service: 'images', action: 'search' });

    if (!mossImageService.isAvailable()) {
      return res.status(503).json({
        ok: false,
        error: 'Image search service is not available',
        message: 'MOSS_PROJECT_ID and MOSS_PROJECT_KEY must be configured'
      });
    }

    if (!query && !image) {
      return res.status(400).json({
        ok: false,
        error: 'Either query or image must be provided'
      });
    }

    try {
      let results;
      if (image) {
        // Image similarity search
        results = await mossImageService.searchByImage(image, maxResults);
        log.info('Image similarity search completed', { 
          resultsCount: results.length 
        });
      } else {
        // Text search
        results = await mossImageService.searchByText(query!, maxResults);
        log.info('Image text search completed', { 
          query, 
          resultsCount: results.length 
        });
      }

      res.json({
        ok: true,
        results,
        count: results.length,
        query: query || 'image similarity'
      });
    } catch (error: any) {
      log.error('Failed to search images', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to search images'
      });
    }
  })
);

/**
 * GET /api/v1/images/:imageId
 * Get a specific indexed image by ID
 */
router.get('/:imageId',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'images', action: 'get' });

    if (!mossImageService.isAvailable()) {
      return res.status(503).json({
        ok: false,
        error: 'Image search service is not available'
      });
    }

    try {
      const image = await mossImageService.getImage(imageId);

      if (!image) {
        return res.status(404).json({
          ok: false,
          error: 'Image not found'
        });
      }

      log.info('Retrieved image', { imageId });
      res.json({
        ok: true,
        image
      });
    } catch (error: any) {
      log.error('Failed to get image', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get image'
      });
    }
  })
);

export { router as imageRoutes };

