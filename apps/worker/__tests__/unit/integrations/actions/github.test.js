"use strict";
/**
 * Unit tests for GitHub actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("../../../../src/integrations/actions/github");
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
describe('GitHub Actions', () => {
    const mockSafeAction = client_1.safeAction;
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock env variables
        env_1.env.GITHUB_CONNECTED_ACCOUNT_ID = 'ac_test123';
        env_1.env.COMPOSIO_USER_ID = 'user_test123';
        env_1.env.COMPOSIO_API_KEY = 'key_test123';
        env_1.env.GITHUB_REPO_SLUG = 'owner/repo';
    });
    describe('createGithubIssue', () => {
        it('should create an issue successfully', async () => {
            const mockResult = {
                ok: true,
                mocked: false,
                type: 'github',
                payload: {},
                result: {
                    number: 1,
                    html_url: 'https://github.com/owner/repo/issues/1',
                },
            };
            mockSafeAction.mockResolvedValue(mockResult);
            const result = await (0, github_1.createGithubIssue)('Test Issue', 'Issue body');
            expect(client_1.safeAction).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
        it('should throw error if repo slug is invalid', async () => {
            env_1.env.GITHUB_REPO_SLUG = 'invalid';
            await expect((0, github_1.createGithubIssue)('Test', 'Body')).rejects.toThrow();
        });
        it('should use provided repo slug', async () => {
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github',
                payload: {},
                result: {},
            });
            await (0, github_1.createGithubIssue)('Test', 'Body', 'custom/owner');
            expect(client_1.safeAction).toHaveBeenCalledWith('github', expect.objectContaining({ owner: 'custom', name: 'owner' }), expect.any(Function));
        });
    });
    describe('getGithubRepo', () => {
        it('should get repository information', async () => {
            const mockRepo = {
                id: 1,
                name: 'repo',
                full_name: 'owner/repo',
                html_url: 'https://github.com/owner/repo',
                owner: { login: 'owner' },
            };
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github-get-repo',
                payload: {},
                result: mockRepo,
            });
            const result = await (0, github_1.getGithubRepo)('owner', 'repo');
            expect(result).toEqual(mockRepo);
            expect(client_1.safeAction).toHaveBeenCalled();
        });
    });
    describe('listGithubIssues', () => {
        it('should list issues', async () => {
            const mockIssues = [
                { number: 1, title: 'Issue 1', state: 'open', html_url: 'url1' },
                { number: 2, title: 'Issue 2', state: 'open', html_url: 'url2' },
            ];
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github-list-issues',
                payload: {},
                result: mockIssues,
            });
            const result = await (0, github_1.listGithubIssues)('owner', 'repo');
            expect(result).toEqual(mockIssues);
        });
        it('should return empty array if mocked', async () => {
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: true,
                type: 'github-list-issues',
                payload: {},
                result: [],
            });
            const result = await (0, github_1.listGithubIssues)('owner', 'repo');
            expect(result).toEqual([]);
        });
    });
    describe('getGithubIssue', () => {
        it('should get a specific issue', async () => {
            const mockIssue = {
                number: 1,
                title: 'Test Issue',
                state: 'open',
                html_url: 'https://github.com/owner/repo/issues/1',
            };
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github-get-issue',
                payload: {},
                result: mockIssue,
            });
            const result = await (0, github_1.getGithubIssue)('owner', 'repo', 1);
            expect(result).toEqual(mockIssue);
        });
    });
    describe('updateGithubIssue', () => {
        it('should update an issue', async () => {
            const mockIssue = {
                number: 1,
                title: 'Updated Title',
                state: 'closed',
                html_url: 'https://github.com/owner/repo/issues/1',
            };
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github-update-issue',
                payload: {},
                result: mockIssue,
            });
            const result = await (0, github_1.updateGithubIssue)('owner', 'repo', 1, {
                title: 'Updated Title',
                state: 'closed',
            });
            expect(result).toEqual(mockIssue);
        });
    });
    describe('addGithubIssueComment', () => {
        it('should add a comment to an issue', async () => {
            const mockComment = {
                id: 1,
                body: 'Test comment',
            };
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'github-add-comment',
                payload: {},
                result: mockComment,
            });
            const result = await (0, github_1.addGithubIssueComment)('owner', 'repo', 1, 'Test comment');
            expect(result).toEqual(mockComment);
        });
    });
});
