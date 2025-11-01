/**
 * Conversations API
 * UI-focused endpoints for chat and Q&A
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { conversationService } from '../../services/conversation-service';
import { logger } from '../../core/logging/logger';

const router = Router();

// Validation schemas
const AskSchema = z.object({
  question: z.string().min(1),
  sessionId: z.string().optional(),
  persona: z.string().optional(),
  channel: z.object({
    type: z.enum(['web', 'voice', 'slack', 'email', 'github', 'calendar']),
    id: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
});

const ChatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string(),
  persona: z.string().optional(),
});

const StartSessionSchema = z.object({
  channelType: z.enum(['web', 'voice', 'slack', 'email', 'github', 'calendar']).optional().default('web'),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  persona: z.string().optional().default('default'),
  userName: z.string().optional().default('User'),
});

// Also support legacy format for backward compatibility
const StartConversationSchema = z.union([
  StartSessionSchema,
  z.object({
    channel: z.object({
      type: z.enum(['web', 'voice', 'slack', 'email', 'github', 'calendar']),
      id: z.string().optional(),
      name: z.string().optional(),
    }).optional(),
    persona: z.string().optional().default('default'),
    userName: z.string().optional().default('User'),
  }),
]);

/**
 * POST /api/v1/conversations/ask
 * Ask a question and get an answer
 */
router.post('/ask',
  rateLimiters.standard,
  timeouts.expensive,
  validate({ body: AskSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { question, sessionId, persona, channel } = req.body;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'ask' });

    log.info('Ask question', { question, sessionId });

    try {
      const answer = await conversationService.ask(question, {
        sessionId,
        persona,
        channel,
      });

      res.json({
        ok: true,
        answer,
      });
    } catch (error: any) {
      log.error('Ask question failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to answer question',
      });
    }
  })
);

/**
 * POST /api/v1/conversations/chat
 * Send a chat message and get response
 */
router.post('/chat',
  rateLimiters.standard,
  timeouts.expensive,
  validate({ body: ChatSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { message, sessionId, persona } = req.body;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'chat' });

    log.info('Chat message', { sessionId });

    try {
      const response = await conversationService.chat(message, sessionId, { persona });

      res.json({
        ok: true,
        response,
      });
    } catch (error: any) {
      log.error('Chat failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to process chat',
      });
    }
  })
);

// IMPORTANT: Static routes must come before parameterized routes
// Place /start and /end before /:sessionId

/**
 * POST /api/unified/conversations/start
 * Start a new conversation session
 */
router.post('/start',
  rateLimiters.standard,
  validate({ body: StartConversationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as any;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'start' });

    try {
      // Support both new format (channelType) and legacy format (channel)
      let channelType = body.channelType || body.channel?.type || 'web';
      let channelId = body.channelId || body.channel?.id;
      let channelName = body.channelName || body.channel?.name;
      const persona = body.persona || 'default';
      const userName = body.userName || 'User';

      const conversation = await conversationService.startConversation({
        channelType: channelType as any,
        channelId,
        channelName,
        persona,
        userName,
      });

      if (!conversation) {
        return res.status(500).json({
          ok: false,
          error: 'Failed to create conversation',
        });
      }

      res.status(201).json({
        ok: true,
        conversation,
      });
    } catch (error: any) {
      log.error('Start session failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to start session',
      });
    }
  })
);

/**
 * POST /api/unified/conversations/end
 * End a conversation session
 */
router.post('/end',
  rateLimiters.standard,
  validate({ body: z.object({ sessionId: z.string().min(1) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'end' });

    try {
      const success = await conversationService.endConversation(sessionId);

      if (success) {
        res.json({
          ok: true,
          message: 'Session ended',
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Failed to end session',
        });
      }
    } catch (error: any) {
      log.error('End session failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to end session',
      });
    }
  })
);

/**
 * GET /api/unified/conversations/:sessionId
 * Get conversation details
 */
router.get('/:sessionId',
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'get' });

    try {
      const conversation = await conversationService.getConversation(sessionId);

      if (!conversation) {
        return res.status(404).json({
          ok: false,
          error: 'Conversation not found',
        });
      }

      res.json({
        ok: true,
        conversation,
      });
    } catch (error: any) {
      log.error('Get conversation failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get conversation',
      });
    }
  })
);

/**
 * GET /api/unified/conversations/:sessionId/messages
 * Get all messages for a conversation
 */
router.get('/:sessionId/messages',
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'getMessages' });

    try {
      const messages = await conversationService.getMessages(sessionId);
      res.json({
        ok: true,
        messages,
        count: messages.length,
      });
    } catch (error: any) {
      log.error('Get messages failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get messages',
      });
    }
  })
);

/**
 * POST /api/unified/conversations/:sessionId/messages
 * Send a message in a conversation and get an AI response
 */
router.post('/:sessionId/messages',
  rateLimiters.standard,
  timeouts.expensive,
  validate({
    params: z.object({ sessionId: z.string().min(1) }),
    body: z.object({
      sessionId: z.string().min(1),
      from: z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        type: z.enum(['user', 'bot', 'system']),
      }),
      text: z.string().min(1),
      persona: z.string().optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { from, text, persona } = req.body;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'sendMessage' });

    // Ensure sessionId in body matches params
    if (req.body.sessionId !== sessionId) {
      return res.status(400).json({
        ok: false,
        error: 'Session ID in body must match URL parameter',
      });
    }

    try {
      const responseMessage = await conversationService.sendMessage({
        sessionId,
        from,
        text,
        persona,
      });

      res.status(201).json({
        ok: true,
        message: responseMessage,
      });
    } catch (error: any) {
      log.error('Send message failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send message',
      });
    }
  })
);

/**
 * POST /api/unified/conversations/:sessionId/end (legacy support - must come after /:sessionId/messages)
 */
router.post('/:sessionId/end',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'end' });

    try {
      const success = await conversationService.endConversation(sessionId);

      if (success) {
        res.json({
          ok: true,
          message: 'Session ended',
        });
      } else {
        res.status(500).json({
          ok: false,
          error: 'Failed to end session',
        });
      }
    } catch (error: any) {
      log.error('End session failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to end session',
      });
    }
  })
);

/**
 * GET /api/v1/conversations/:sessionId/history (legacy support)
 */
router.get('/:sessionId/history',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const log = (req as any).logger || logger.child({ service: 'conversations', action: 'history' });

    try {
      const messages = await conversationService.getHistory(sessionId, limit);

      res.json({
        ok: true,
        messages,
        count: messages.length,
      });
    } catch (error: any) {
      log.error('Get history failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get history',
      });
    }
  })
);

export { router as conversationRoutes };

