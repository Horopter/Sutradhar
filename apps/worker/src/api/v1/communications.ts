/**
 * Communications API
 * UI-focused endpoints for messaging across platforms
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { communicationService } from '../../services/communication-service';
import { logger } from '../../core/logging/logger';
import { Platform, Channel, MessageInput } from '../../models/communication';

const router = Router();

// Validation schemas
const SendMessageSchema = z.object({
  channel: z.object({
    id: z.string(),
    platform: z.enum(['slack', 'github', 'email', 'calendar']),
  }),
  text: z.string().min(1),
  threadId: z.string().optional(),
});

const ListChannelsSchema = z.object({
  platform: z.enum(['slack', 'github', 'email', 'calendar']),
});

const GetMessagesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  before: z.number().optional(),
  after: z.number().optional(),
  threadId: z.string().optional(),
});

/**
 * POST /api/unified/communications/email/send
 * Send an email
 */
router.post('/email/send',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: z.object({
    to: z.array(z.string().email()).min(1),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    htmlBody: z.string().optional(),
    fromAddress: z.string().email().optional(),
    fromName: z.string().optional(),
    threadId: z.string().optional(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'sendEmail' });
    
    try {
      const email = await communicationService.sendEmail(payload);
      res.json({ ok: true, email });
    } catch (error: any) {
      log.error('Send email failed', { error: error.message });
      res.status(500).json({ ok: false, error: error.message || 'Failed to send email' });
    }
  })
);

/**
 * POST /api/unified/communications/slack/post
 * Post a message to Slack
 */
router.post('/slack/post',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: z.object({
    channelId: z.string().min(1),
    text: z.string().min(1),
    threadTs: z.string().optional(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'postSlack' });
    
    try {
      const message = await communicationService.postSlackMessage(payload);
      res.json({ ok: true, message });
    } catch (error: any) {
      log.error('Post Slack message failed', { error: error.message });
      res.status(500).json({ ok: false, error: error.message || 'Failed to post Slack message' });
    }
  })
);

/**
 * POST /api/unified/communications/messages
 * Send a message to a channel (legacy)
 */
router.post('/messages',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: SendMessageSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { channel, text, threadId } = req.body;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'sendMessage' });

    log.info('Send message', { platform: channel.platform, channelId: channel.id });

    try {
      const channelObj: Channel = {
        id: channel.id,
        platform: channel.platform,
        name: channel.id, // Will be resolved if needed
        type: 'public',
      };

      const message: MessageInput = {
        channelId: channel.id,
        platform: channel.platform,
        text,
        threadId,
      };

      const result = await communicationService.sendMessage(channelObj, message);

      res.json({
        ok: result.success,
        result,
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
 * GET /api/v1/messages
 * Get messages from a channel
 */
router.get('/',
  rateLimiters.standard,
  validate({ query: z.object({
    channelId: z.string(),
    platform: z.enum(['slack', 'github', 'email', 'calendar']),
    limit: z.string().optional(),
    threadId: z.string().optional(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId, platform, limit, threadId } = req.query;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'getMessages' });

    try {
      const channel: Channel = {
        id: channelId as string,
        platform: platform as Platform,
        name: channelId as string,
        type: 'public',
      };

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        threadId: threadId as string | undefined,
      };

      const messages = await communicationService.getMessages(channel, options);

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
 * GET /api/v1/channels
 * List channels for a platform
 */
router.get('/channels',
  rateLimiters.standard,
  validate({ query: ListChannelsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { platform } = req.query;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'listChannels' });

    try {
      const channels = await communicationService.listChannels(platform as Platform);

      res.json({
        ok: true,
        channels,
        count: channels.length,
      });
    } catch (error: any) {
      log.error('List channels failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list channels',
      });
    }
  })
);

/**
 * GET /api/v1/channels/:id
 * Get a specific channel
 */
router.get('/channels/:id',
  rateLimiters.standard,
  validate({ query: z.object({
    platform: z.enum(['slack', 'github', 'email', 'calendar']),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { platform } = req.query;
    const log = (req as any).logger || logger.child({ service: 'communications', action: 'getChannel' });

    try {
      const channel = await communicationService.getChannel(id, platform as Platform);

      if (!channel) {
        return res.status(404).json({
          ok: false,
          error: 'Channel not found',
        });
      }

      res.json({
        ok: true,
        channel,
      });
    } catch (error: any) {
      log.error('Get channel failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get channel',
      });
    }
  })
);

export { router as communicationRoutes };

