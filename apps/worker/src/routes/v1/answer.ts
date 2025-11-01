/**
 * Answer API Routes
 * Retrieval-augmented generation endpoints
 */

import { Router, Request } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate, deduplicateOperation } from '../../core/middleware';
import { answerService } from '../../core/services/answer-service';
import { logger } from '../../core/logging/logger';
import { z } from 'zod';

const router = Router();

const AnswerSchema = z.object({
  sessionId: z.string().optional().default("demo-session"),
  question: z.string().min(1),
  persona: z.string().optional()
});

/**
 * POST /api/v1/answer
 * Get AI answer with retrieval-augmented generation
 */
router.post('/',
  rateLimiters.perSession,
  timeouts.expensive,
  validate({ body: AnswerSchema }),
  asyncHandler(async (req: Request, res) => {
    const p = AnswerSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ sessionId: p.sessionId });
    
    log.verbose('Answer request received', {
      question: p.question.substring(0, 100),
      persona: p.persona,
    });
    
    // Deduplicate identical answer requests
    const dedupeKey = `answer:${p.sessionId}:${p.question}`;
    const result = await deduplicateOperation(
      dedupeKey,
      async () => {
        log.debug('Processing answer request', { dedupeKey });
        const answer = await answerService.answerQuestion(p.sessionId!, p.question, p.persona);
           log.info('Answer generated', {
             answerLength: answer.finalText?.length || 0,
             sourceCount: answer.citations?.length || 0,
             latencyMs: answer.latencyMs,
           });
        return answer;
      },
      5000
    );
    
    log.verbose('Answer request completed');
    
    res.json({
      ok: true,
      ...result,
      message: 'AI assistant responded.'
    });
  })
);

export { router as answerRoutes };

