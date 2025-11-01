/**
 * GitHub Integration
 * Complete GitHub operations via Composio SDK
 */

import { safeAction } from "../integrations/actions/client";
import { env } from "../env";
import { log } from "../log";
import { ComposioToolSet } from "composio-core";

// ============================================================================
// Interfaces for mocking and type safety
// ============================================================================

export interface GitHubIssueCreateParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface GitHubIssueUpdateParams {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

export interface GitHubIssueListOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  limit?: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  owner: {
    login: string;
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  html_url: string;
  labels?: Array<{ name: string }>;
  assignees?: Array<{ login: string }>;
}

export interface GitHubService {
  createIssue(owner: string, repo: string, params: GitHubIssueCreateParams): Promise<any>;
  getRepo(owner: string, repo: string): Promise<GitHubRepository>;
  listIssues(owner: string, repo: string, options?: GitHubIssueListOptions): Promise<GitHubIssue[]>;
  getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue>;
  updateIssue(owner: string, repo: string, issueNumber: number, updates: GitHubIssueUpdateParams): Promise<GitHubIssue>;
  addIssueComment(owner: string, repo: string, issueNumber: number, body: string): Promise<any>;
}

// ============================================================================
// Helper functions - NO hardcoded IDs, throw errors if missing
// ============================================================================

function getGitHubConnectedAccountId(): string {
  const id = env.GITHUB_CONNECTED_ACCOUNT_ID;
  if (!id) {
    throw new Error('GITHUB_CONNECTED_ACCOUNT_ID not configured. Set it in .secrets.env');
  }
  return id;
}

function getComposioUserId(): string {
  const userId = env.COMPOSIO_USER_ID || env.RUBE_USER_ID;
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

function createComposioClient(): ComposioToolSet {
  return new ComposioToolSet({ apiKey: getComposioApiKey() });
}

// ============================================================================
// GitHub Operations
// ============================================================================

/**
 * Create a GitHub issue
 */
export async function createGithubIssue(title: string, body: string, repoSlug?: string) {
  const repo = repoSlug || env.GITHUB_REPO_SLUG;
  if (!repo) {
    throw new Error("GITHUB_REPO_SLUG or repoSlug parameter is required");
  }
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid repo slug format: ${repo}. Expected format: owner/repo`);
  }
  
  return safeAction("github", { owner, name, title }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      log.info('Executing GitHub action with connectedAccountId');
      const result: any = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_CREATE_AN_ISSUE",
        params: {
          owner,
          repo: name,
          title,
          body
        }
      });
      
      if (result) {
        const data = result.data || result;
        const htmlUrl = data?.html_url || data?.htmlUrl || data?.url;
        const issueNumber = data?.number || data?.issue_number;
        if (htmlUrl) {
          log.info(`🐙 GitHub issue created: #${issueNumber || 'N/A'} - ${htmlUrl}`);
        }
      }
      
      return result;
    } catch (connectedAccountError: any) {
      log.warn(`Failed with connectedAccountId, trying with entityId: ${connectedAccountError.message}`);
      
      try {
        log.info('Executing GitHub action with entityId');
        const result: any = await composio.executeAction({
          entityId,
          action: "GITHUB_CREATE_AN_ISSUE",
          params: {
            owner,
            repo: name,
            title,
            body
          }
        });
        
        if (result) {
          const data = result.data || result;
          const htmlUrl = data?.html_url || data?.htmlUrl || data?.url;
          const issueNumber = data?.number || data?.issue_number;
          if (htmlUrl) {
            log.info(`🐙 GitHub issue created: #${issueNumber || 'N/A'} - ${htmlUrl}`);
          }
        }
        
        return result;
      } catch (entityError: any) {
        const errorMsg = entityError?.message || String(entityError);
        log.error(`Both connectedAccountId and entityId failed: ${errorMsg}`);
        
        if (errorMsg.includes('Could not find a connection')) {
          throw new Error(`${errorMsg}. Please ensure GitHub connection is configured in Composio dashboard.`);
        }
        if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          throw new Error(`${errorMsg}. Hint: Ensure Composio GitHub connection has write access to ${owner}/${name}.`);
        }
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          throw new Error(`${errorMsg}. Hint: Ensure Composio GitHub connection has write permissions for ${owner}/${name}.`);
        }
        throw entityError;
      }
    }
  });
}

/**
 * Get repository information
 */
export async function getGithubRepo(owner: string, repo: string): Promise<GitHubRepository> {
  const result = await safeAction("github-get-repo", { owner, repo }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const actionResult = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_GET_REPOSITORY",
        params: { owner, repo }
      });
      return actionResult.data || actionResult;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const actionResult = await composio.executeAction({
        entityId,
        action: "GITHUB_GET_REPOSITORY",
        params: { owner, repo }
      });
      return actionResult.data || actionResult;
    }
  });
  
  // safeAction returns SafeActionResult with result property
  const safeActionResult = result as any;
  return safeActionResult.result || result;
}

/**
 * List issues for a repository
 */
export async function listGithubIssues(
  owner: string,
  repo: string,
  options?: GitHubIssueListOptions
): Promise<GitHubIssue[]> {
  const result = await safeAction("github-list-issues", { owner, repo, options }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const actionResult = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_LIST_ISSUES",
        params: {
          owner,
          repo,
          state: options?.state || 'open',
          labels: options?.labels?.join(','),
          assignee: options?.assignee,
        }
      });
      return actionResult.data?.items || actionResult.data || actionResult || [];
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const actionResult = await composio.executeAction({
        entityId,
        action: "GITHUB_LIST_ISSUES",
        params: {
          owner,
          repo,
          state: options?.state || 'open',
        }
      });
      return actionResult.data?.items || actionResult.data || actionResult || [];
    }
  });
  
  if (result.mocked) {
    return [];
  }
  return (result.result as GitHubIssue[]) || [];
}

/**
 * Get a specific issue
 */
export async function getGithubIssue(owner: string, repo: string, issueNumber: number): Promise<any> {
  const result = await safeAction("github-get-issue", { owner, repo, issueNumber }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const actionResult = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_GET_ISSUE",
        params: { owner, repo, issue_number: issueNumber }
      });
      return actionResult.data || actionResult;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const actionResult = await composio.executeAction({
        entityId,
        action: "GITHUB_GET_ISSUE",
        params: { owner, repo, issue_number: issueNumber }
      });
      return actionResult.data || actionResult;
    }
  });
  
  // safeAction returns SafeActionResult with result property
  return (result as any).result || result;
}

/**
 * Update an issue
 */
export async function updateGithubIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  updates: GitHubIssueUpdateParams
): Promise<GitHubIssue> {
  const result = await safeAction("github-update-issue", { owner, repo, issueNumber, updates }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const actionResult = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_UPDATE_ISSUE",
        params: {
          owner,
          repo,
          issue_number: issueNumber,
          title: updates.title,
          body: updates.body,
          state: updates.state,
          labels: updates.labels,
          assignees: updates.assignees,
        }
      });
      return actionResult.data || actionResult;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const actionResult = await composio.executeAction({
        entityId,
        action: "GITHUB_UPDATE_ISSUE",
        params: {
          owner,
          repo,
          issue_number: issueNumber,
          title: updates.title,
          body: updates.body,
          state: updates.state,
        }
      });
      return actionResult.data || actionResult;
    }
  });
  
  // safeAction returns SafeActionResult with result property
  return (result as any).result || result;
}

/**
 * Add comment to issue
 */
export async function addGithubIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<any> {
  return safeAction("github-add-comment", { owner, repo, issueNumber, body }, async () => {
    const composio = createComposioClient();
    const connectedAccountId = getGitHubConnectedAccountId();
    const entityId = getComposioUserId();
    
    try {
      const result = await composio.executeAction({
        connectedAccountId,
        action: "GITHUB_ADD_ISSUE_COMMENT",
        params: { owner, repo, issue_number: issueNumber, body }
      });
      return result.data || result;
    } catch (error: any) {
      log.warn(`Failed with connectedAccountId, trying entityId: ${error.message}`);
      const result = await composio.executeAction({
        entityId,
        action: "GITHUB_ADD_ISSUE_COMMENT",
        params: { owner, repo, issue_number: issueNumber, body }
      });
      return result.data || result;
    }
  });
}
