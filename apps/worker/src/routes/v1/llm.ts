/**
 * LLM API Routes
 * Direct LLM access endpoints
 */

import { Router } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate, deduplicateOperation } from '../../core/middleware';
import { llmService } from '../../core/services/llm-service';
import { sessionService } from '../../core/services/session-service';
import { checkGuardrails } from '../../core/guardrails';
import { SYSTEM_ANSWER, SYSTEM_SUMMARIZE, SYSTEM_ESCALATE } from '../../llm/prompts';
import { z } from 'zod';

const router = Router();

const LlmAnswerSchema = z.object({
  sessionId: z.string().optional(),
  question: z.string().min(1),
  provider: z.enum(["openai", "perplexity"]).optional(),
  model: z.string().optional()
});

const SummarizeSchema = z.object({
  body: z.string().min(1)
});

const EscalateSchema = z.object({
  body: z.string().min(1)
});

/**
 * POST /api/v1/llm/answer
 * Get direct LLM response (with guardrails)
 */
router.post('/answer',
  rateLimiters.strict,
  timeouts.expensive,
  validate({ body: LlmAnswerSchema }),
  asyncHandler(async (req, res) => {
    const p = LlmAnswerSchema.parse(req.body);
    
    // Deduplicate identical LLM requests
    const dedupeKey = `llm:${p.question}:${p.provider || 'default'}:${p.model || 'default'}`;
    
    const result = await deduplicateOperation(
      dedupeKey,
      async () => {
        // Apply guardrails before sending to LLM
        const guardrailCheck = await checkGuardrails(p.question, undefined, 'default');
        if (!guardrailCheck.allowed) {
          if (p.sessionId) {
            await sessionService.appendMessage(p.sessionId, "user", p.question, [], 0);
            await sessionService.appendMessage(
              p.sessionId,
              "agent",
              guardrailCheck.reason || 'I cannot answer this question.',
              [],
              0
            );
          }
          
          return {
            ok: false,
            text: guardrailCheck.reason || 'I cannot answer this question.',
            error: 'Query blocked by guardrails',
            blocked: true,
          };
        }
        
        const llmResult = await llmService.chat({
          system: SYSTEM_ANSWER,
          user: p.question,
          provider: p.provider,
          model: p.model,
        });
        
        // TODO: Record LLM metrics via metrics service
        
        if (llmResult.ok && llmResult.data && p.sessionId) {
          await sessionService.appendMessage(p.sessionId, "agent", llmResult.data.text, [], 0);
        }
        
        return {
          ok: llmResult.ok,
          text: llmResult.data?.text || '',
          error: llmResult.error,
          message: llmResult.ok ? 'LLM response generated.' : undefined
        };
      },
      5000
    );
    
    res.json(result);
  })
);

/**
 * POST /api/v1/llm/summarize
 * Summarize text using LLM
 */
router.post('/summarize',
  rateLimiters.strict,
  timeouts.expensive,
  validate({ body: SummarizeSchema }),
  asyncHandler(async (req, res) => {
    const p = SummarizeSchema.parse(req.body);
    
    const result = await llmService.chat({
      system: SYSTEM_SUMMARIZE,
      user: p.body,
    });
    
    res.json({
      ok: result.ok,
      text: result.data?.text || '',
      error: result.error,
      message: result.ok ? 'Text summarized successfully.' : undefined
    });
  })
);

/**
 * POST /api/v1/llm/escalate
 * Analyze query for escalation needs
 */
router.post('/escalate',
  rateLimiters.strict,
  timeouts.expensive,
  validate({ body: EscalateSchema }),
  asyncHandler(async (req, res) => {
    const p = EscalateSchema.parse(req.body);
    
    const result = await llmService.chat({
      system: SYSTEM_ESCALATE,
      user: p.body,
    });
    
    res.json({
      ok: result.ok,
      text: result.data?.text || '',
      error: result.error,
      message: result.ok ? 'Escalation analysis complete.' : undefined
    });
  })
);

export { router as llmRoutes };

