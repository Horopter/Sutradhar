/**
 * Unit tests for GitHub actions
 */

import { 
  createGithubIssue,
  getGithubRepo, 
  listGithubIssues, 
  getGithubIssue, 
  updateGithubIssue, 
  addGithubIssueComment 
} from '../../../../src/integrations/actions/github';
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

describe('GitHub Actions', () => {
  const mockSafeAction = safeAction as jest.MockedFunction<typeof safeAction>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock env variables
    (env as any).GITHUB_CONNECTED_ACCOUNT_ID = 'ac_test123';
    (env as any).COMPOSIO_USER_ID = 'user_test123';
    (env as any).COMPOSIO_API_KEY = 'key_test123';
    (env as any).GITHUB_REPO_SLUG = 'owner/repo';
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

      const result = await createGithubIssue('Test Issue', 'Issue body');

      expect(safeAction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if repo slug is invalid', async () => {
      (env as any).GITHUB_REPO_SLUG = 'invalid';
      
      await expect(createGithubIssue('Test', 'Body')).rejects.toThrow();
    });

    it('should use provided repo slug', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'github',
        payload: {},
        result: {},
      });

      await createGithubIssue('Test', 'Body', 'custom/owner');

      expect(safeAction).toHaveBeenCalledWith(
        'github',
        expect.objectContaining({ owner: 'custom', name: 'owner' }),
        expect.any(Function)
      );
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

      const result = await getGithubRepo('owner', 'repo');

      expect(result).toEqual(mockRepo);
      expect(safeAction).toHaveBeenCalled();
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

      const result = await listGithubIssues('owner', 'repo');

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

      const result = await listGithubIssues('owner', 'repo');

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

      const result = await getGithubIssue('owner', 'repo', 1);

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

      const result = await updateGithubIssue('owner', 'repo', 1, {
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

      const result = await addGithubIssueComment('owner', 'repo', 1, 'Test comment');

      expect(result).toEqual(mockComment);
    });
  });
});

