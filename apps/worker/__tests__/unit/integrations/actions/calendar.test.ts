/**
 * Unit tests for Calendar actions
 */

import {
  createCalendarEvent,
  listCalendars,
  getCalendar,
  listCalendarEvents,
  getCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../../../../src/integrations/actions/calendar';
import { safeAction } from '../../../../src/integrations/actions/client';
import { env } from '../../../../src/env';

// Mock dependencies
jest.mock('../../../../src/integrations/actions/client');
jest.mock('../../../../src/env');
jest.mock('composio-core');
jest.mock('../../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../../src/convexClient', () => ({
  Convex: {
    sessions: { start: jest.fn(), end: jest.fn(), list: jest.fn() },
    messages: { append: jest.fn(), bySession: jest.fn() },
    actions: { log: jest.fn(), listBySession: jest.fn() },
    escalations: { upsert: jest.fn() },
    logs: { append: jest.fn(), bySession: jest.fn(), recentSessions: jest.fn() },
  },
}));

describe('Calendar Actions', () => {
  const mockSafeAction = safeAction as jest.MockedFunction<typeof safeAction>;

  beforeEach(() => {
    jest.clearAllMocks();

    (env as any).GCAL_CONNECTED_ACCOUNT_ID = 'ac_cal123';
    (env as any).COMPOSIO_USER_ID = 'user_test123';
    (env as any).COMPOSIO_API_KEY = 'key_test123';
    (env as any).GCAL_CALENDAR_ID = 'primary';
  });

  describe('createCalendarEvent', () => {
    it('should create an event successfully', async () => {
      const mockEvent = {
        id: 'event123',
        summary: 'Test Event',
        htmlLink: 'https://calendar.google.com/event?eid=event123',
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar',
        payload: {},
        result: mockEvent,
      });

      const startISO = '2024-01-15T10:00:00Z';
      const endISO = '2024-01-15T11:00:00Z';

      const result = await createCalendarEvent('Test Event', startISO, endISO, 'Description');

      expect(result).toBeDefined();
      expect(safeAction).toHaveBeenCalled();
    });

    it('should use default calendar if not provided', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar',
        payload: {},
        result: {},
      });

      await createCalendarEvent('Test', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z');

      expect(safeAction).toHaveBeenCalledWith(
        'calendar',
        expect.objectContaining({ calId: 'primary' }),
        expect.any(Function)
      );
    });

    it('should throw error if calendar ID is missing', async () => {
      (env as any).GCAL_CALENDAR_ID = undefined;

      await expect(
        createCalendarEvent('Test', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z')
      ).rejects.toThrow();
    });

    it('should handle RFC3339 date formats', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar',
        payload: {},
        result: {},
      });

      await createCalendarEvent(
        'Test',
        '2024-01-15T10:00:00+00:00',
        '2024-01-15T11:00:00+00:00'
      );

      expect(safeAction).toHaveBeenCalled();
    });
  });

  describe('listCalendars', () => {
    it('should list calendars', async () => {
      const mockCalendars = [
        { id: 'primary', summary: 'Primary Calendar' },
        { id: 'cal2', summary: 'Secondary Calendar' },
      ];

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-list',
        payload: {},
        result: mockCalendars,
      });

      const result = await listCalendars();

      expect(result).toEqual(mockCalendars);
    });
  });

  describe('getCalendar', () => {
    it('should get calendar information', async () => {
      const mockCalendar = {
        id: 'primary',
        summary: 'Primary Calendar',
        timeZone: 'America/New_York',
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-get',
        payload: {},
        result: mockCalendar,
      });

      const result = await getCalendar('primary');

      expect(result).toEqual(mockCalendar);
    });
  });

  describe('listCalendarEvents', () => {
    it('should list events in a calendar', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Event 1',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ];

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-list-events',
        payload: {},
        result: mockEvents,
      });

      const result = await listCalendarEvents('primary');

      expect(result).toEqual(mockEvents);
    });

    it('should support filtering options', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-list-events',
        payload: {},
        result: [],
      });

      await listCalendarEvents('primary', {
        timeMin: '2024-01-15T00:00:00Z',
        timeMax: '2024-01-16T00:00:00Z',
        maxResults: 10,
      });

      expect(safeAction).toHaveBeenCalled();
    });
  });

  describe('getCalendarEvent', () => {
    it('should get a specific event', async () => {
      const mockEvent = {
        id: 'event123',
        summary: 'Test Event',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-get-event',
        payload: {},
        result: mockEvent,
      });

      const result = await getCalendarEvent('primary', 'event123');

      expect(result).toEqual(mockEvent);
    });
  });

  describe('updateCalendarEvent', () => {
    it('should update an event', async () => {
      const mockEvent = {
        id: 'event123',
        summary: 'Updated Event',
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-update-event',
        payload: {},
        result: mockEvent,
      });

      const result = await updateCalendarEvent('primary', 'event123', {
        summary: 'Updated Event',
      });

      expect(result).toEqual(mockEvent);
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should delete an event', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'calendar-delete-event',
        payload: {},
        result: undefined,
      });

      await deleteCalendarEvent('primary', 'event123');

      expect(safeAction).toHaveBeenCalled();
    });
  });
});

