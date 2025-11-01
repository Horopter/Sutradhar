/**
 * Knowledge API
 * UI-focused endpoints for search and indexing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { knowledgeService } from '../../services/knowledge-service';
import { logger } from '../../core/logging/logger';
import { SearchQuery, ImageSearchQuery, ContentToIndex, ImageInput } from '../../models/knowledge';

const router = Router();

// Validation schemas
const SearchSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().int().min(1).max(100).optional().default(10),
  filters: z.object({
    sources: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.number().optional(),
      end: z.number().optional(),
    }).optional(),
  }).optional(),
  options: z.object({
    includeMetadata: z.boolean().optional(),
    minScore: z.number().optional(),
  }).optional(),
});

const ImageSearchSchema = z.object({
  query: z.string().min(1).optional(),
  image: z.object({
    url: z.string().url().optional(),
    base64: z.string().optional(),
    id: z.string().optional(),
  }).optional(),
  maxResults: z.number().int().min(1).max(100).optional().default(10),
  sessionId: z.string().optional(),
}).refine(data => data.query || data.image, {
  message: "Either 'query' or 'image' must be provided",
  path: ["query"],
});

const IndexContentSchema = z.object({
  content: z.union([
    z.object({
      id: z.string(),
      text: z.string(),
      source: z.string(),
      metadata: z.record(z.any()).optional(),
    }),
    z.array(z.object({
      id: z.string(),
      text: z.string(),
      source: z.string(),
      metadata: z.record(z.any()).optional(),
    })),
  ]),
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

/**
 * POST /api/unified/knowledge/documents/search
 * Search documents and content
 */
router.post('/documents/search',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: SearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query: SearchQuery = req.body;
    const log = (req as any).logger || logger.child({ service: 'knowledge', action: 'search' });

    log.info('Search', { query: query.query });

    try {
      const results = await knowledgeService.search(query);

      res.json({
        ok: true,
        results,
      });
    } catch (error: any) {
      log.error('Search failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to search',
      });
    }
  })
);

/**
 * POST /api/unified/knowledge/images/search
 * Search images by text or image similarity
 */
router.post('/images/search',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: ImageSearchSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query: ImageSearchQuery = req.body;
    const log = (req as any).logger || logger.child({ service: 'knowledge', action: 'searchImages' });

    log.info('Search images', { hasQuery: !!query.query, hasImage: !!query.image });

    try {
      const results = await knowledgeService.searchImages(query);

      res.json({
        ok: true,
        results,
      });
    } catch (error: any) {
      log.error('Image search failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to search images',
      });
    }
  })
);

/**
 * POST /api/unified/knowledge/documents/index
 * Index content for search
 */
router.post('/documents/index',
  rateLimiters.strict,
  timeouts.indexing,
  validate({ body: IndexContentSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;
    const log = (req as any).logger || logger.child({ service: 'knowledge', action: 'index' });

    try {
      const contents: ContentToIndex[] = Array.isArray(content) ? content : [content];
      
      await knowledgeService.indexContent(contents);

      log.info('Content indexed', { count: contents.length });

      res.json({
        ok: true,
        indexed: contents.length,
        message: `Indexed ${contents.length} item(s)`,
      });
    } catch (error: any) {
      log.error('Index content failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to index content',
      });
    }
  })
);

/**
 * POST /api/unified/knowledge/images/index
 * Index images for search
 */
router.post('/images/index',
  rateLimiters.strict,
  timeouts.indexing,
  validate({ body: IndexImageSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { images } = req.body;
    const log = (req as any).logger || logger.child({ service: 'knowledge', action: 'indexImages' });

    try {
      const imageInputs: ImageInput[] = images.map((img: any) => ({
        id: img.id,
        url: img.url,
        base64: img.base64,
        metadata: img.metadata,
      }));

      await knowledgeService.indexImage(imageInputs);

      log.info('Images indexed', { count: images.length });

      res.json({
        ok: true,
        indexed: images.length,
        message: `Indexed ${images.length} image(s)`,
      });
    } catch (error: any) {
      log.error('Index images failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to index images',
      });
    }
  })
);

export { router as knowledgeRoutes };

