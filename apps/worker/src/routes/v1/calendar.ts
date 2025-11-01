/**
 * Google Calendar RESTful API Routes
 * Complete CRUD operations for Calendar resources
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, rateLimiters, timeouts, validate } from '../../core/middleware';
import { 
  createCalendarEvent,
  listCalendars, 
  getCalendar, 
  listCalendarEvents, 
  getCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from '../../integrations/actions/calendar';
import { logger } from '../../core/logging/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateEventSchema = z.object({
  title: z.string().min(1),
  startISO: z.string().min(1),
  endISO: z.string().min(1),
  description: z.string().optional().default(''),
  calendarId: z.string().optional(),
  sessionId: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timezone: z.string().optional().default('UTC'),
});

const UpdateEventSchema = z.object({
  title: z.string().optional(),
  startISO: z.string().optional(),
  endISO: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timezone: z.string().optional(),
});

/**
 * GET /api/v1/calendar/calendars
 * List calendars
 */
router.get(
  '/calendars',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'list-calendars' });
    
    log.verbose('List calendars');
    
    try {
      const result = await listCalendars();
      // listCalendars returns Calendar[] directly
      const calendars = Array.isArray(result) ? result : [];
      log.info('Retrieved calendars', { count: Array.isArray(calendars) ? calendars.length : 0 });
      
      res.json({
        ok: true,
        data: {
          calendars: Array.isArray(calendars) ? calendars : [],
          count: Array.isArray(calendars) ? calendars.length : 0,
        },
      });
    } catch (error: any) {
      log.error('Failed to list calendars', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list calendars',
      });
    }
  })
);

/**
 * GET /api/v1/calendar/calendars/:calendarId
 * Get calendar information
 */
router.get(
  '/calendars/:calendarId',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'get-calendar' });
    
    log.verbose('Get calendar info', { calendarId });
    
    try {
      const result = await getCalendar(calendarId);
      log.info('Retrieved calendar info', { calendarId });
      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      log.error('Failed to get calendar info', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get calendar info',
      });
    }
  })
);

/**
 * GET /api/v1/calendar/calendars/:calendarId/events
 * List events in a calendar
 */
router.get(
  '/calendars/:calendarId/events',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId } = req.params;
    const { 
      timeMin, 
      timeMax, 
      maxResults = '2500', 
      singleEvents = 'true',
      orderBy = 'startTime',
    } = req.query;
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'list-events' });
    
    log.verbose('List events', { 
      calendarId, 
      timeMin, 
      timeMax,
      maxResults,
    });
    
    try {
      const result = await listCalendarEvents(calendarId, {
        timeMin: timeMin as string,
        timeMax: timeMax as string,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
        singleEvents: singleEvents === 'true',
        orderBy: (orderBy as 'startTime' | 'updated') || 'startTime',
      });
      
      // listCalendarEvents returns CalendarEvent[] directly
      const events = Array.isArray(result) ? result : [];
      log.info('Retrieved events', { calendarId, count: Array.isArray(events) ? events.length : 0 });
      
      res.json({
        ok: true,
        data: {
          calendarId,
          events: Array.isArray(events) ? events : [],
          count: Array.isArray(events) ? events.length : 0,
        },
      });
    } catch (error: any) {
      log.error('Failed to list events', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to list events',
      });
    }
  })
);

/**
 * POST /api/v1/calendar/calendars/:calendarId/events
 * Create an event
 */
router.post(
  '/calendars/:calendarId/events',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CreateEventSchema.omit({ calendarId: true }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId } = req.params;
    const data = CreateEventSchema.parse({ ...req.body, calendarId });
    const log = (req as any).logger || logger.child({ 
      service: 'calendar', 
      action: 'create-event',
      calendarId,
      sessionId: data.sessionId,
    });
    
    log.info('Creating calendar event', { 
      title: data.title,
      calendarId,
      start: data.startISO,
      end: data.endISO,
    });
    
    try {
      const result = await createCalendarEvent(
        data.title,
        data.startISO,
        data.endISO,
        data.description || '',
        calendarId
      );
      
      const eventData = (result as any)?.data || result;
      const eventId = eventData?.id || eventData?.event_id;
      const htmlLink = eventData?.htmlLink || eventData?.html_link || eventData?.link;
      
      log.info('Calendar event created', { calendarId, eventId, htmlLink });
      
      res.status(201).json({
        ok: true,
        data: {
          calendarId,
          eventId,
          htmlLink,
          event: eventData,
        },
        message: 'Event created successfully',
      });
    } catch (error: any) {
      log.error('Failed to create event', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create event',
      });
    }
  })
);

/**
 * POST /api/v1/calendar/events
 * Create an event (alternative endpoint)
 */
router.post(
  '/events',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CreateEventSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const data = CreateEventSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'create-event' });
    
    if (!data.calendarId) {
      return res.status(400).json({
        ok: false,
        error: 'calendarId required',
        message: 'Provide calendarId in request body',
      });
    }
    
    log.info('Creating calendar event', { 
      title: data.title,
      calendarId: data.calendarId,
    });
    
    try {
      const result = await createCalendarEvent(
        data.title,
        data.startISO,
        data.endISO,
        data.description || '',
        data.calendarId
      );
      
      const eventData = (result as any)?.data || result;
      const eventId = eventData?.id || eventData?.event_id;
      const htmlLink = eventData?.htmlLink || eventData?.html_link || eventData?.link;
      
      log.info('Calendar event created', { calendarId: data.calendarId, eventId, htmlLink });
      
      res.status(201).json({
        ok: true,
        data: {
          calendarId: data.calendarId,
          eventId,
          htmlLink,
          event: eventData,
        },
        message: 'Event created successfully',
      });
    } catch (error: any) {
      log.error('Failed to create event', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to create event',
      });
    }
  })
);

/**
 * GET /api/v1/calendar/calendars/:calendarId/events/:eventId
 * Get a specific event
 */
router.get(
  '/calendars/:calendarId/events/:eventId',
  rateLimiters.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId, eventId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'get-event' });
    
    log.verbose('Get event', { calendarId, eventId });
    
    try {
      const result = await getCalendarEvent(calendarId, eventId);
      log.info('Retrieved event', { calendarId, eventId });
      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      log.error('Failed to get event', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to get event',
      });
    }
  })
);

/**
 * PATCH /api/v1/calendar/calendars/:calendarId/events/:eventId
 * Update an event
 */
router.patch(
  '/calendars/:calendarId/events/:eventId',
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: UpdateEventSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId, eventId } = req.params;
    const data = UpdateEventSchema.parse(req.body);
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'update-event' });
    
    log.info('Update event', { calendarId, eventId, updates: Object.keys(data) });
    
    try {
      const result = await updateCalendarEvent(calendarId, eventId, {
        summary: data.title,
        description: data.description,
        start_datetime: data.startISO,
        end_datetime: data.endISO,
        location: data.location,
      });
      
      log.info('Event updated', { calendarId, eventId });
      res.json({
        ok: true,
        data: result,
        message: 'Event updated successfully',
      });
    } catch (error: any) {
      log.error('Failed to update event', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to update event',
      });
    }
  })
);

/**
 * DELETE /api/v1/calendar/calendars/:calendarId/events/:eventId
 * Delete an event
 */
router.delete(
  '/calendars/:calendarId/events/:eventId',
  rateLimiters.strict,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const { calendarId, eventId } = req.params;
    const log = (req as any).logger || logger.child({ service: 'calendar', action: 'delete-event' });
    
    log.info('Delete event', { calendarId, eventId });
    
    try {
      const result = await deleteCalendarEvent(calendarId, eventId);
      log.info('Event deleted', { calendarId, eventId });
      res.json({
        ok: true,
        data: result,
        message: 'Event deleted successfully',
      });
    } catch (error: any) {
      log.error('Failed to delete event', { error: error.message });
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to delete event',
      });
    }
  })
);

export default router;

