"use strict";
/**
 * Unit tests for GitHub webhook handler
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Mock logger FIRST before any imports
jest.mock('../../../../src/core/logging/logger', () => ({
    logger: {
        child: jest.fn(() => ({
            verbose: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        })),
        verbose: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
// Mock log module
jest.mock('../../../../src/log', () => ({
    log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
const github_1 = require("../../../../src/integrations/webhooks/github");
const github_2 = require("../../../../src/integrations/actions/github");
const answer_service_1 = require("../../../../src/core/services/answer-service");
// Mock dependencies
jest.mock('../../../../src/integrations/actions/github');
jest.mock('../../../../src/core/services/answer-service');
jest.mock('../../../../src/core/logging/logger', () => ({
    logger: {
        child: jest.fn(() => ({
            verbose: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        })),
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
jest.mock('../../../../src/env');
describe('GitHub Webhook Handler', () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            headersSent: false,
        };
    });
    describe('Issue Comment Events', () => {
        it('should process issue comment events', async () => {
            const mockAnswer = {
                finalText: 'This is a helpful response',
                blocked: false,
            };
            const mockIssue = {
                number: 123,
                title: 'Test Issue',
                body: 'Issue description',
            };
            github_2.getGithubIssue.mockResolvedValue(mockIssue);
            answer_service_1.answerService.answerQuestion.mockResolvedValue(mockAnswer);
            github_2.addGithubIssueComment.mockResolvedValue({ ok: true });
            mockReq.headers = { 'x-github-event': 'issue_comment' };
            mockReq.body = {
                action: 'created',
                issue: {
                    number: 123,
                    title: 'Test Issue',
                    body: 'Issue description',
                    repository: {
                        full_name: 'owner/repo',
                        owner: { login: 'owner' },
                        name: 'repo',
                    },
                },
                comment: {
                    id: 1,
                    body: 'How do I fix this?',
                    user: { login: 'user123' },
                },
            };
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(mockRes.send).toHaveBeenCalledWith('OK');
            expect(github_2.getGithubIssue).toHaveBeenCalled();
            expect(answer_service_1.answerService.answerQuestion).toHaveBeenCalled();
            expect(github_2.addGithubIssueComment).toHaveBeenCalled();
        });
        it('should skip non-question comments', async () => {
            mockReq.headers = { 'x-github-event': 'issue_comment' };
            mockReq.body = {
                action: 'created',
                issue: {
                    number: 123,
                    repository: { full_name: 'owner/repo' },
                },
                comment: {
                    body: 'Thanks!', // Not a question
                },
            };
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(answer_service_1.answerService.answerQuestion).not.toHaveBeenCalled();
        });
    });
    describe('New Issue Events', () => {
        it('should process new issue events', async () => {
            const mockAnswer = {
                finalText: 'Thank you for opening this issue.',
                blocked: false,
            };
            answer_service_1.answerService.answerQuestion.mockResolvedValue(mockAnswer);
            github_2.addGithubIssueComment.mockResolvedValue({ ok: true });
            mockReq.headers = { 'x-github-event': 'issues' };
            mockReq.body = {
                action: 'opened',
                issue: {
                    number: 124,
                    title: 'New Issue',
                    body: 'Issue description',
                    repository: {
                        full_name: 'owner/repo',
                        owner: { login: 'owner' },
                        name: 'repo',
                    },
                },
            };
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(answer_service_1.answerService.answerQuestion).toHaveBeenCalled();
            expect(github_2.addGithubIssueComment).toHaveBeenCalled();
        });
    });
    describe('Issue Reopened Events', () => {
        it('should acknowledge reopened issues', async () => {
            github_2.addGithubIssueComment.mockResolvedValue({ ok: true });
            mockReq.headers = { 'x-github-event': 'issues' };
            mockReq.body = {
                action: 'reopened',
                issue: {
                    number: 125,
                    repository: {
                        full_name: 'owner/repo',
                        owner: { login: 'owner' },
                        name: 'repo',
                    },
                },
            };
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(github_2.addGithubIssueComment).toHaveBeenCalledWith('owner', 'repo', 125, expect.stringContaining('reopened'));
        });
    });
    describe('Error Handling', () => {
        it('should handle errors gracefully', async () => {
            mockReq.headers = { 'x-github-event': 'issue_comment' };
            mockReq.body = {
                action: 'created',
                issue: { repository: { full_name: 'owner/repo' } },
                comment: { body: 'Test?' },
            };
            github_2.getGithubIssue.mockRejectedValue(new Error('Test error'));
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(mockRes.send).toHaveBeenCalledWith('OK');
        });
        it('should return 500 on critical errors', async () => {
            mockReq.body = null;
            await (0, github_1.handleGitHubWebhook)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
