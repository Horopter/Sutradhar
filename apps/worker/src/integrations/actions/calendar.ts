/**
 * Google Calendar Integration
 * Complete Calendar operations via Composio SDK
 */

import { safeAction } from "./client";
import { env } from "../../env";
import { log } from "../../log";
import { ComposioToolSet } from "composio-core";

// ============================================================================
// Interfaces for mocking and type safety
// ============================================================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string }>;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
}

export interface CalendarEventCreateParams {
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarEventUpdateParams {
  summary?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
}

export interface CalendarEventListOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

export interface CalendarService {
  createEvent(calendarId: string, params: CalendarEventCreateParams): Promise<CalendarEvent>;
  listCalendars(): Promise<Calendar[]>;
  getCalendar(calendarId: string): Promise<Calendar>;
  listEvents(calendarId: string, options?: CalendarEventListOptions): Promise<CalendarEvent[]>;
  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;
  updateEvent(calendarId: string, eventId: string, updates: CalendarEventUpdateParams): Promise<CalendarEvent>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}

// ============================================================================
// Helper functions - NO hardcoded IDs, throw errors if missing
// ============================================================================

function getGcalConnectedAccountId(): string {
  const id = env.GCAL_CONNECTED_ACCOUNT_ID;
  if (!id) {
    throw new Error('GCAL_CONNECTED_ACCOUNT_ID not configured. Set it in .secrets.env');
  }
  return id;
}

function getComposioUserId(): string {
  // Calendar uses specific user ID if specified, otherwise fall back to standard user ID
  const userId = env.GCAL_USER_ID || env.COMPOSIO_USER_ID || env.RUBE_USER_ID;
  if (!userId) {
    throw new Error('COMPOSIO_USER_ID or RUBE_USER_ID not configured. Set it in .secrets.env');
  }
  return userId;
}

function getComposioApiKey(): string {
  const apiKey = env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY not configured. Set it in .secrets.env');
  }
  return apiKey;
}

function getDefaultCalendarId(): string {
  const calendarId = env.GCAL_CALENDAR_ID;
  if (!calendarId) {
    throw new Error('GCAL_CALENDAR_ID not configured. Set it in .secrets.env or pass calendarId parameter');
  }
  return calendarId;
}

function createComposioClient(): ComposioToolSet {
  return new ComposioToolSet({ apiKey: getComposioApiKey() });
}

// Ensure RFC3339 format (YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+00:00)
function ensureRFC3339(isoString: string): string {
  if (!isoString.includes('T')) {
    throw new Error(`Invalid ISO date format: ${isoString}. Expected RFC3339 format (YYYY-MM-DDTHH:mm:ssZ)`);
  }
  // If it ends with Z, it's already RFC3339
  if (isoString.endsWith('Z')) {
    return isoString;
  }
  // If it has timezone offset, keep it
  if (isoString.match(/[+-]\d{2}:\d{2}$/)) {
    return isoString;
  }
  // Otherwise, assume UTC and append Z
  return isoString.endsWith('Z') ? isoString : `${isoString}Z`;
}

// ============================================================================
// Calendar Operations
// ============================================================================

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  title: string,
  startISO: string,
  endISO: string,
  description = "",
  calendarId?: string
): Promise<CalendarEvent> {
  const calId = calendarId || getDefaultCalendarId();
  const startRFC3339 = ensureRFC3339(startISO);
  const endRFC3339 = ensureRFC3339(endISO);
  
  const result = await safeAction("calendar", { title, startISO: startRFC3339, endISO: endRFC3339, calId }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      log.info('Executing Calendar action with connectedAccountId');
      const result: any = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_CREATE_EVENT",
        params: {
          calendar_id: calId,
          summary: title,
          description,
          start_datetime: startRFC3339,
          end_datetime: endRFC3339
        }
      });
      
      if (result) {
        const data = result.data || result;
        const eventId = data?.id || data?.event_id;
        const htmlLink = data?.htmlLink || data?.html_link || data?.link;
        if (eventId) {
          log.info(`📅 Calendar event created: ID=${eventId}, Link=${htmlLink || 'N/A'}`);
        }
      }
      
      return result.data || result;
    } catch (connectedAccountError: any) {
      log.warn(`Failed with connectedAccountId, trying with entityId: ${connectedAccountError.message}`);
      
      try {
        log.info('Executing Calendar action with entityId');
        const result: any = await composio.executeAction({
          entityId,
          action: "GOOGLECALENDAR_CREATE_EVENT",
          params: {
            calendar_id: calId,
            summary: title,
            description,
            start_datetime: startRFC3339,
            end_datetime: endRFC3339
          }
        });
        
        if (result) {
          const data = result.data || result;
          const eventId = data?.id || data?.event_id;
          const htmlLink = data?.htmlLink || data?.html_link || data?.link;
          if (eventId) {
            log.info(`📅 Calendar event created: ID=${eventId}, Link=${htmlLink || 'N/A'}`);
          }
        }
        
        return result.data || result;
      } catch (entityError: any) {
        const errorMsg = entityError?.message || String(entityError);
        log.error(`Both connectedAccountId and entityId failed: ${errorMsg}`);
        
        if (errorMsg.includes('Could not find a connection')) {
          throw new Error(`${errorMsg}. Please ensure Google Calendar connection is configured in Composio dashboard.`);
        }
        if (errorMsg.includes('calendar not found') || errorMsg.includes('Calendar not found')) {
          throw new Error(`${errorMsg}. Hint: Double-check calendar ID ${calId}.`);
        }
        throw entityError;
      }
    }
  });
  
  return ((result.result as unknown as CalendarEvent) || ((result as any).data as unknown as CalendarEvent) || (result as unknown as CalendarEvent)) as CalendarEvent;
}

/**
 * List calendars
 */
export async function listCalendars(): Promise<Calendar[]> {
  const result = await safeAction("calendar-list", {}, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_LIST_CALENDARS",
        params: {}
      });
      return result.data?.items || result.data || result || [];
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_LIST_CALENDARS",
        params: {}
      });
      return result.data?.items || result.data || result || [];
    }
  });
  
  if (result.mocked) {
    return [];
  }
  return (result.result as Calendar[]) || [];
}

/**
 * Get calendar information
 */
export async function getCalendar(calendarId: string): Promise<Calendar> {
  const result = await safeAction("calendar-get", { calendarId }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_GET_CALENDAR",
        params: { calendar_id: calendarId }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_GET_CALENDAR",
        params: { calendar_id: calendarId }
      });
      return result.data || result;
    }
  });
  
  return ((result.result as unknown as Calendar) || ((result as any).data as unknown as Calendar) || (result as unknown as Calendar)) as Calendar;
}

/**
 * List events in a calendar
 */
export async function listCalendarEvents(
  calendarId: string,
  options?: CalendarEventListOptions
): Promise<CalendarEvent[]> {
  const result = await safeAction("calendar-list-events", { calendarId, options }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_LIST_EVENTS",
        params: {
          calendar_id: calendarId,
          time_min: options?.timeMin,
          time_max: options?.timeMax,
          max_results: options?.maxResults,
          single_events: options?.singleEvents,
          order_by: options?.orderBy,
        }
      });
      return result.data?.items || result.data || result || [];
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_LIST_EVENTS",
        params: {
          calendar_id: calendarId,
          time_min: options?.timeMin,
          time_max: options?.timeMax,
        }
      });
      return result.data?.items || result.data || result || [];
    }
  });
  
  if (result.mocked) {
    return [];
  }
  return (result.result as CalendarEvent[]) || [];
}

/**
 * Get a specific event
 */
export async function getCalendarEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
  const result = await safeAction("calendar-get-event", { calendarId, eventId }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_GET_EVENT",
        params: { calendar_id: calendarId, event_id: eventId }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_GET_EVENT",
        params: { calendar_id: calendarId, event_id: eventId }
      });
      return result.data || result;
    }
  });
  
  return ((result.result as unknown as CalendarEvent) || ((result as any).data as unknown as CalendarEvent) || (result as unknown as CalendarEvent)) as CalendarEvent;
}

/**
 * Update an event
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: CalendarEventUpdateParams
): Promise<CalendarEvent> {
  const result = await safeAction("calendar-update-event", { calendarId, eventId, updates }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_UPDATE_EVENT",
        params: {
          calendar_id: calendarId,
          event_id: eventId,
          summary: updates.summary,
          description: updates.description,
          start_datetime: updates.start_datetime,
          end_datetime: updates.end_datetime,
          location: updates.location,
        }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_UPDATE_EVENT",
        params: {
          calendar_id: calendarId,
          event_id: eventId,
          summary: updates.summary,
          description: updates.description,
        }
      });
      return result.data || result;
    }
  });
  
  return ((result.result as unknown as CalendarEvent) || ((result as any).data as unknown as CalendarEvent) || (result as unknown as CalendarEvent)) as CalendarEvent;
}

/**
 * Delete an event
 */
export async function deleteCalendarEvent(calendarId: string, eventId: string): Promise<void> {
  await safeAction("calendar-delete-event", { calendarId, eventId }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGcalConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GOOGLECALENDAR_DELETE_EVENT",
        params: { calendar_id: calendarId, event_id: eventId }
      });
      return result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GOOGLECALENDAR_DELETE_EVENT",
        params: { calendar_id: calendarId, event_id: eventId }
      });
      return result;
    }
  });
}
