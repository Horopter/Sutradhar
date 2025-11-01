/**
 * Slack RESTful API Routes
 * Complete CRUD operations for Slack resources
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { 
  slackPostMessage, 
  slackListMessages, 
  slackDeleteMessage,
  listSlackChannels, 
  getSlackChannel, 
  updateSlackMessage, 
  getSlackMessage 
} from '../../integrations/actions/slack';
import { logger } from '../../core/logging/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const SendMessageSchema = z.object({
  text: z.string().min(1),
  channelId: z.string().optional(),
  sessionId: z.string().optional(),
  threadTs: z.string().optional(), // Reply to thread (Slack timestamp)
  blocks: z.array(z.any()).optional(), // Slack Block Kit
});

const UpdateMessageSchema = z.object({
  text: z.string().min(1).optional(),
  channelId: z.string(),
  ts: z.string(),
  blocks: z.array(z.any()).optional(),
});

/**
 * GET /api/v1/slack/channels
 * List channels
 */
router.get(
  '/channels',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { types, excludeArchived } = req.query;
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'list-channels' });
    
    log.verbose('List channels', { types, excludeArchived });
    
    try {
      const result = await listSlackChannels({
        types: types as string,
        excludeArchived: excludeArchived === 'true',
      });
      
      // listSlackChannels returns SlackChannel[] directly
      const channels = Array.isArray(result) ? result : [];
      log.info('Retrieved channels', { count: Array.isArray(channels) ? channels.length : 0 });
      
      res.json({
        ok: true,
        data: {
          channels: Array.isArray(channels) ? channels : [],
          count: Array.isArray(channels) ? channels.length : 0,
        },
      });
    } catch (error: any) {
      log.error('Failed to list channels', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list channels',
      });
    }
  })
);

/**
 * GET /api/v1/slack/channels/:channelId
 * Get channel information
 */
router.get(
  '/channels/:channelId',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'get-channel' });
    
    log.verbose('Get channel info', { channelId });
    
    try {
      const result = await getSlackChannel(channelId);
      log.info('Retrieved channel info', { channelId });
      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      log.error('Failed to get channel info', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get channel info',
      });
    }
  })
);

/**
 * GET /api/v1/slack/channels/:channelId/messages
 * List messages in a channel
 */
router.get(
  '/channels/:channelId/messages',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const { limit = '100', cursor, oldest, latest } = req.query;
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'list-messages' });
    
    log.verbose('List messages', { channelId, limit });
    
    try {
      const messages = await slackListMessages(channelId, parseInt(limit as string));
      
      log.info('Retrieved messages', { 
        channelId, 
        messageCount: Array.isArray(messages) ? messages.length : 0,
      });
      
      res.json({
        ok: true,
        data: {
          channelId,
          messages: Array.isArray(messages) ? messages : [],
          count: Array.isArray(messages) ? messages.length : 0,
        },
      });
    } catch (error: any) {
      log.error('Failed to list messages', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list messages',
      });
    }
  })
);

/**
 * POST /api/v1/slack/channels/:channelId/messages
 * Send a message to a channel
 */
router.post(
  '/channels/:channelId/messages',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SendMessageSchema.omit({ channelId: true }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const data = SendMessageSchema.parse({ ...req.body, channelId });
    const log = (req as any).logger || logger.child({ 
      service: 'slack', 
      action: 'send-message',
      channelId,
      sessionId: data.sessionId,
    });
    
    log.info('Sending Slack message', { 
      channelId,
      textLength: data.text.length,
      isThread: !!data.threadTs,
    });
    
    try {
      const result = await slackPostMessage(data.text, channelId, data.threadTs);
      
      const messageData = (result as any)?.data || result;
      const ts = messageData?.ts || messageData?.message_ts;
      const permalink = messageData?.permalink || messageData?.message?.permalink;
      
      log.info('Slack message sent', { channelId, ts, permalink });
      
      res.status(201).json({
        ok: true,
        data: {
          channelId,
          ts,
          permalink,
          message: messageData,
        },
        message: 'Message sent successfully',
      });
    } catch (error: any) {
      log.error('Failed to send message', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send message',
      });
    }
  })
);

/**
 * POST /api/v1/slack/messages
 * Send a message (alternative endpoint)
 */
router.post(
  '/messages',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SendMessageSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = SendMessageSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'send-message' });
    
    if (!data.channelId) {
      return res.status(400).json({
        ok: false,
        error: 'channelId required',
        message: 'Provide channelId in request body',
      });
    }
    
    log.info('Sending Slack message', { 
      channelId: data.channelId,
      textLength: data.text.length,
    });
    
    try {
      const result = await slackPostMessage(data.text, data.channelId, data.threadTs);
      
      const messageData = (result as any)?.data || result;
      const ts = messageData?.ts || messageData?.message_ts;
      const permalink = messageData?.permalink || messageData?.message?.permalink;
      
      log.info('Slack message sent', { channelId: data.channelId, ts, permalink });
      
      res.status(201).json({
        ok: true,
        data: {
          channelId: data.channelId,
          ts,
          permalink,
          message: messageData,
        },
        message: 'Message sent successfully',
      });
    } catch (error: any) {
      log.error('Failed to send message', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to send message',
      });
    }
  })
);

/**
 * GET /api/v1/slack/channels/:channelId/messages/:ts
 * Get a specific message
 */
router.get(
  '/channels/:channelId/messages/:ts',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId, ts } = req.params;
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'get-message' });
    
    log.verbose('Get message', { channelId, ts });
    
    try {
      const message = await getSlackMessage(channelId, ts);
      if (!message) {
        return res.status(404).json({
          ok: false,
          error: 'Message not found',
        });
      }
      
      log.info('Retrieved message', { channelId, ts });
      res.json({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      log.error('Failed to get message', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get message',
      });
    }
  })
);

/**
 * PUT /api/v1/slack/channels/:channelId/messages/:ts
 * Update a message
 */
router.put(
  '/channels/:channelId/messages/:ts',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: UpdateMessageSchema.omit({ channelId: true, ts: true }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId, ts } = req.params;
    const data = UpdateMessageSchema.parse({ ...req.body, channelId, ts });
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'update-message' });
    
    log.info('Update message', { channelId, ts, updates: Object.keys(data) });
    
    if (!data.text && !data.blocks) {
      return res.status(400).json({
        ok: false,
        error: 'text or blocks required',
        message: 'Provide text or blocks to update',
      });
    }
    
    try {
      const result = await updateSlackMessage(channelId, ts, data.text || '', data.blocks);
      log.info('Message updated', { channelId, ts });
      res.json({
        ok: true,
        data: result,
        message: 'Message updated successfully',
      });
    } catch (error: any) {
      log.error('Failed to update message', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to update message',
      });
    }
  })
);

/**
 * DELETE /api/v1/slack/channels/:channelId/messages/:ts
 * Delete a message
 */
router.delete(
  '/channels/:channelId/messages/:ts',
  rateLimiters.strict,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { channelId, ts } = req.params;
    const log = (req as any).logger || logger.child({ service: 'slack', action: 'delete-message' });
    
    log.info('Delete message', { channelId, ts });
    
    try {
      const result = await slackDeleteMessage(channelId, ts);
      
      log.info('Message deleted', { channelId, ts });
      
      res.json({
        ok: true,
        data: result,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      log.error('Failed to delete message', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to delete message',
      });
    }
  })
);

export default router;

