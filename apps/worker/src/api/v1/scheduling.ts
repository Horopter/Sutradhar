/**
 * Scheduling API
 * UI-focused endpoints for calendar and events
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { unifiedActionService } from '../../services/action-service';
import { logger } from '../../core/logging/logger';
import { Event } from '../../models/action';

const router = Router();

// Validation schemas
const CreateEventSchema = z.object({
  calendarId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
});

const UpdateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
});

/**
 * POST /api/unified/scheduling/events
 * Create a calendar event
 */
router.post('/events',
  rateLimiters.standard,
  timeouts.standard,
  validate({ body: CreateEventSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId, title, description, startTime, endTime, location, attendees } = req.body;
    const log = (req as any).logger || logger.child({ service: 'scheduling', action: 'createEvent' });

    log.info('Create event', { calendarId, title });

    try {
      const event: Event = {
        type: 'event',
        title,
        description,
        status: 'pending',
        calendar: calendarId,
        startTime,
        endTime,
        location,
        attendees,
      };

      const result = await unifiedActionService.createTask(event);

      res.status(result.success ? 201 : 500).json({
        ok: result.success,
        result,
      });
    } catch (error: any) {
      log.error('Create event failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create event',
      });
    }
  })
);

/**
 * GET /api/unified/scheduling/events
 * List calendar events
 */
router.get('/events',
  rateLimiters.standard,
  validate({ query: z.object({
    calendarId: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId } = req.query;
    const log = (req as any).logger || logger.child({ service: 'scheduling', action: 'listEvents' });

    try {
      // Delegate to Calendar integration
      const { listCalendarEvents } = await import('../../integrations/actions/calendar');
      const result: any = await listCalendarEvents(calendarId as string);
      const events = Array.isArray(result) ? result : (result.events || []);

      res.json({
        ok: true,
        events,
        count: events.length,
      });
    } catch (error: any) {
      log.error('List events failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list events',
      });
    }
  })
);

/**
 * GET /api/unified/scheduling/events/:eventId
 * Get a specific event
 */
router.get('/events/:eventId',
  rateLimiters.standard,
  validate({ query: z.object({
    calendarId: z.string(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId: id } = req.params;
    const { calendarId: calendar } = req.query;
    const log = (req as any).logger || logger.child({ service: 'scheduling', action: 'getEvent' });

    try {
      // Get event using unified service
      const event = await unifiedActionService.getTask(id, 'event', { calendarId: calendar as string });

      if (!event) {
        return res.status(404).json({
          ok: false,
          error: 'Event not found',
        });
      }

      res.json({
        ok: true,
        event,
      });
    } catch (error: any) {
      log.error('Get event failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get event',
      });
    }
  })
);

/**
 * PUT /api/unified/scheduling/events/:eventId
 * Update an event
 */
router.put('/events/:eventId',
  rateLimiters.standard,
  timeouts.standard,
  validate({
    query: z.object({
      calendarId: z.string(),
    }),
    body: UpdateEventSchema,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId: id } = req.params;
    const { calendarId: calendar } = req.query;
    const updates = req.body;
    const log = (req as any).logger || logger.child({ service: 'scheduling', action: 'updateEvent' });

    try {
      // Get existing event using unified service
      const existing = await unifiedActionService.getTask(id, 'event', { calendarId: calendar as string });

      if (!existing) {
        return res.status(404).json({
          ok: false,
          error: 'Event not found',
        });
      }

      const result = await unifiedActionService.updateTask(id, existing as any, updates);

      res.json({
        ok: result.success,
        result,
      });
    } catch (error: any) {
      log.error('Update event failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to update event',
      });
    }
  })
);

/**
 * DELETE /api/unified/scheduling/events/:eventId
 * Delete an event
 */
router.delete('/events/:eventId',
  rateLimiters.strict,
  validate({ query: z.object({
    calendarId: z.string(),
  }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId: id } = req.params;
    const { calendarId: calendar } = req.query;
    const log = (req as any).logger || logger.child({ service: 'scheduling', action: 'deleteEvent' });

    try {
      const success = await unifiedActionService.deleteTask(id, 'event', { calendarId: calendar as string });

      res.json({
        ok: success,
        message: success ? 'Event deleted' : 'Failed to delete event',
      });
    } catch (error: any) {
      log.error('Delete event failed', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to delete event',
      });
    }
  })
);

export { router as schedulingRoutes };
