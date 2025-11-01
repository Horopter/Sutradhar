/**
 * Google Calendar Webhook Handler
 * Receives Calendar events and handles reschedule requests
 */

import { Request, Response } from 'express';
import { 
  getCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createCalendarEvent,
  listCalendarEvents
} from '../actions/calendar';
import { answerService } from '../../core/services/answer-service';
import { logger } from '../../core/logging/logger';

export interface CalendarWebhookEvent {
  type: string;
  events?: Array<{
    id: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    htmlLink?: string;
  }>;
}

/**
 * Handle Google Calendar webhook events
 * Processes calendar events and handles reschedule requests
 */
export async function handleCalendarWebhook(req: Request, res: Response): Promise<void> {
  const log = logger.child({ service: 'calendar-webhook' });
  
  try {
    // Google Calendar sends sync token on initial setup
    const syncToken = req.query.sync_token as string;
    if (syncToken) {
      log.verbose('Calendar sync token received', { syncToken });
      res.status(200).send('OK');
      return;
    }
    
    // Handle calendar event changes
    const calendarId = req.params.calendarId || req.query.calendarId as string;
    const event: CalendarWebhookEvent = req.body;
    
    log.info('Received calendar webhook', {
      calendarId,
      eventType: event.type,
      eventCount: event.events?.length || 0,
    });
    
    // Respond immediately
    res.status(200).send('OK');
    
    // Process in background
    processCalendarEvent(calendarId || 'primary', event).catch((error: any) => {
      log.error('Failed to process calendar event', { error: error.message });
    });
  } catch (error: any) {
    log.error('Calendar webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Process calendar webhook events
 */
async function processCalendarEvent(
  calendarId: string,
  event: CalendarWebhookEvent
): Promise<void> {
  const log = logger.child({ service: 'calendar-processor' });
  
  try {
    if (!event.events || event.events.length === 0) {
      log.verbose('No events in calendar webhook');
      return;
    }
    
    // Process each event
    for (const calendarEvent of event.events) {
      if (!calendarEvent.id) {
        continue;
      }
      
      // Check if event description contains reschedule request
      if (calendarEvent.description) {
        const desc = calendarEvent.description.toLowerCase();
        const isRescheduleRequest = desc.includes('reschedule') ||
                                    desc.includes('move to') ||
                                    desc.includes('change time') ||
                                    desc.includes('postpone') ||
                                    desc.includes('new time');
        
        if (isRescheduleRequest) {
          await handleRescheduleRequest(calendarId, calendarEvent);
        }
      }
      
      // Check for cancellation requests
      if (calendarEvent.description) {
        const desc = calendarEvent.description.toLowerCase();
        const isCancellationRequest = desc.includes('cancel') ||
                                      desc.includes('remove') ||
                                      desc.includes('delete meeting');
        
        if (isCancellationRequest) {
          await handleCancellationRequest(calendarId, calendarEvent);
        }
      }
    }
  } catch (error: any) {
    log.error('Failed to process calendar event', { error: error.message });
  }
}

/**
 * Handle reschedule request - analyze description and update event
 */
async function handleRescheduleRequest(
  calendarId: string,
  event: { id: string; summary?: string; description?: string; start?: { dateTime?: string }; end?: { dateTime?: string } }
): Promise<void> {
  const log = logger.child({ service: 'calendar-reschedule' });
  
  log.info('Processing reschedule request', {
    calendarId,
    eventId: event.id,
  });
  
  try {
    // Get full event details
    const fullEvent = await getCalendarEvent(calendarId, event.id);
    
    // Use LLM to extract new time from description
    const sessionId = `calendar-${calendarId}-${event.id}`;
    const prompt = `Extract the new date and time for this reschedule request. 
Event: ${event.summary}
Description: ${event.description}
Current start: ${fullEvent.start?.dateTime || event.start?.dateTime}
Current end: ${fullEvent.end?.dateTime || event.end?.dateTime}

Return only the new start and end times in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ), or say "unable to parse" if unclear.`;
    
    const result = await answerService.answerQuestion(sessionId, prompt, 'Greeter');
    
    if (result.blocked || !result.finalText) {
      log.warn('Unable to parse reschedule request');
      return;
    }
    
    // Try to extract dates from LLM response
    const dateMatch = result.finalText.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?)/g);
    if (dateMatch && dateMatch.length >= 2) {
      const newStart = dateMatch[0];
      const newEnd = dateMatch[1];
      
      // Update event
      await updateCalendarEvent(calendarId, event.id, {
        start_datetime: newStart,
        end_datetime: newEnd,
      });
      
      log.info('Successfully rescheduled event', {
        calendarId,
        eventId: event.id,
        newStart,
        newEnd,
      });
    } else {
      log.warn('Could not extract valid dates from reschedule request', {
        llmResponse: result.finalText,
      });
    }
  } catch (error: any) {
    log.error('Failed to handle reschedule request', { error: error.message });
  }
}

/**
 * Handle cancellation request - delete event
 */
async function handleCancellationRequest(
  calendarId: string,
  event: { id: string; summary?: string }
): Promise<void> {
  const log = logger.child({ service: 'calendar-cancellation' });
  
  log.info('Processing cancellation request', {
    calendarId,
    eventId: event.id,
    summary: event.summary,
  });
  
  try {
    await deleteCalendarEvent(calendarId, event.id);
    log.info('Successfully cancelled event', {
      calendarId,
      eventId: event.id,
    });
  } catch (error: any) {
    log.error('Failed to cancel event', { error: error.message });
  }
}

