"use strict";
/**
 * Unit tests for Calendar actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const calendar_1 = require("../../../../src/integrations/actions/calendar");
const client_1 = require("../../../../src/integrations/actions/client");
const env_1 = require("../../../../src/env");
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
    const mockSafeAction = client_1.safeAction;
    beforeEach(() => {
        jest.clearAllMocks();
        env_1.env.GCAL_CONNECTED_ACCOUNT_ID = 'ac_cal123';
        env_1.env.COMPOSIO_USER_ID = 'user_test123';
        env_1.env.COMPOSIO_API_KEY = 'key_test123';
        env_1.env.GCAL_CALENDAR_ID = 'primary';
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
            const result = await (0, calendar_1.createCalendarEvent)('Test Event', startISO, endISO, 'Description');
            expect(result).toBeDefined();
            expect(client_1.safeAction).toHaveBeenCalled();
        });
        it('should use default calendar if not provided', async () => {
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'calendar',
                payload: {},
                result: {},
            });
            await (0, calendar_1.createCalendarEvent)('Test', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z');
            expect(client_1.safeAction).toHaveBeenCalledWith('calendar', expect.objectContaining({ calId: 'primary' }), expect.any(Function));
        });
        it('should throw error if calendar ID is missing', async () => {
            env_1.env.GCAL_CALENDAR_ID = undefined;
            await expect((0, calendar_1.createCalendarEvent)('Test', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z')).rejects.toThrow();
        });
        it('should handle RFC3339 date formats', async () => {
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'calendar',
                payload: {},
                result: {},
            });
            await (0, calendar_1.createCalendarEvent)('Test', '2024-01-15T10:00:00+00:00', '2024-01-15T11:00:00+00:00');
            expect(client_1.safeAction).toHaveBeenCalled();
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
            const result = await (0, calendar_1.listCalendars)();
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
            const result = await (0, calendar_1.getCalendar)('primary');
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
            const result = await (0, calendar_1.listCalendarEvents)('primary');
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
            await (0, calendar_1.listCalendarEvents)('primary', {
                timeMin: '2024-01-15T00:00:00Z',
                timeMax: '2024-01-16T00:00:00Z',
                maxResults: 10,
            });
            expect(client_1.safeAction).toHaveBeenCalled();
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
            const result = await (0, calendar_1.getCalendarEvent)('primary', 'event123');
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
            const result = await (0, calendar_1.updateCalendarEvent)('primary', 'event123', {
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
            await (0, calendar_1.deleteCalendarEvent)('primary', 'event123');
            expect(client_1.safeAction).toHaveBeenCalled();
        });
    });
});
