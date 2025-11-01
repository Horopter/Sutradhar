/**
 * Retrieval API Routes
 * Document indexing and search endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts } from '../../core/middleware';

const router = Router();

/**
 * POST /api/v1/retrieval/index
 * Index documents from seed directory
 */
router.post('/index',
  rateLimiters.strict,
  timeouts.indexing,
  asyncHandler(async (req, res) => {
    // Import dynamically to avoid circular deps
    const { indexSeedLocal } = await import('../../retrieval/indexSeed');
    const r = await indexSeedLocal();
    res.json({
      ok: true,
      docCount: r.docCount,
      message: `Indexed ${r.docCount} document(s) successfully.`
    });
  })
);

export { router as retrievalRoutes };

