/**
 * GitHub Webhook Handler
 * Receives GitHub events and responds using LLM
 */

import { Request, Response } from 'express';
import { 
  addGithubIssueComment, 
  getGithubIssue, 
  updateGithubIssue,
  getGithubRepo 
} from '../actions/github';
import { answerService } from '../../core/services/answer-service';
import { logger } from '../../core/logging/logger';

export interface GitHubWebhookEvent {
  action?: string;
  issue?: {
    number: number;
    title: string;
    body?: string;
    state: string;
    html_url: string;
    user: { login: string };
    repository: {
      full_name: string;
      owner: { login: string };
      name: string;
    };
  };
  comment?: {
    id: number;
    body: string;
    user: { login: string };
    html_url: string;
  };
  repository?: {
    full_name: string;
    owner: { login: string };
    name: string;
  };
}

/**
 * Handle GitHub webhook events
 * Responds to issue comments, new issues, etc.
 */
export async function handleGitHubWebhook(req: Request, res: Response): Promise<void> {
  const log = logger.child({ service: 'github-webhook' });
  
  try {
    const event: GitHubWebhookEvent = req.body;
    const eventType = req.headers['x-github-event'] as string;
    
    log.info('Received GitHub webhook', { 
      eventType,
      action: event.action,
    });
    
    // Process the event (synchronously for tests, async for production)
    if (process.env.NODE_ENV === 'test') {
      // In tests, process synchronously so assertions work
      await processGitHubEvent(eventType, event);
      res.status(200).send('OK');
    } else {
      // In production, respond immediately and process async
      res.status(200).send('OK');
      processGitHubEvent(eventType, event).catch((error: any) => {
        log.error('Failed to process GitHub event', { error: error.message });
      });
    }
  } catch (error: any) {
    log.error('GitHub webhook error', { error: error.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Process GitHub webhook events
 */
async function processGitHubEvent(
  eventType: string,
  event: GitHubWebhookEvent
): Promise<void> {
  const log = logger.child({ service: 'github-processor' });
  
  try {
    // Handle issue comment events
    if (eventType === 'issue_comment' && event.action === 'created' && event.comment && event.issue) {
      await handleIssueComment(event);
      return;
    }
    
    // Handle new issue events
    if (eventType === 'issues' && event.action === 'opened' && event.issue) {
      await handleNewIssue(event);
      return;
    }
    
    // Handle issue reopened
    if (eventType === 'issues' && event.action === 'reopened' && event.issue) {
      await handleIssueReopened(event);
      return;
    }
    
    log.verbose('Unhandled GitHub event type', { eventType, action: event.action });
  } catch (error: any) {
    log.error('Failed to process GitHub event', { error: error.message, eventType });
  }
}

/**
 * Handle issue comment - analyze and respond
 */
async function handleIssueComment(event: GitHubWebhookEvent): Promise<void> {
  const log = logger.child({ service: 'github-issue-comment' });
  
  if (!event.comment || !event.issue || !event.repository) {
    return;
  }
  
  const { comment, issue, repository } = event;
  const [owner, repo] = repository.full_name.split('/');
  
  log.info('Processing issue comment', {
    repo: repository.full_name,
    issueNumber: issue.number,
    commentAuthor: comment.user?.login || 'unknown',
  });
  
  // Check if comment is asking a question or needs response
  const commentText = comment.body.toLowerCase();
  const isQuestion = commentText.includes('?') || 
                     commentText.includes('help') ||
                     commentText.includes('how') ||
                     commentText.includes('what') ||
                     commentText.includes('why') ||
                     commentText.includes('when');
  
  if (!isQuestion) {
    log.verbose('Comment does not require response');
    return;
  }
  
  // Get full issue context
  const fullIssue = await getGithubIssue(owner, repo, issue.number);
  
  // Generate response using answer service
  const sessionId = `github-${repository.full_name}-${issue.number}`;
  const context = `Issue #${issue.number}: ${issue.title}\n\n${issue.body || ''}\n\nComment: ${comment.body}`;
  
  const result = await answerService.answerQuestion(
    sessionId,
    context,
    'Greeter' // Could use 'Moderator' for GitHub
  );
  
  if (result.blocked) {
    log.warn('Issue comment response blocked by guardrails');
    return;
  }
  
  // Post response as comment  
  const responseText = result.finalText || 'I received your comment.';
  await addGithubIssueComment(owner, repo, issue.number, responseText);
  
  log.info('Successfully responded to issue comment', {
    repo: repository.full_name,
    issueNumber: issue.number,
    sessionId,
  });
}

/**
 * Handle new issue - analyze and provide initial response
 */
async function handleNewIssue(event: GitHubWebhookEvent): Promise<void> {
  const log = logger.child({ service: 'github-new-issue' });
  
  if (!event.issue || !event.repository) {
    return;
  }
  
  const { issue, repository } = event;
  const [owner, repo] = repository.full_name.split('/');
  
  log.info('Processing new issue', {
    repo: repository.full_name,
    issueNumber: issue.number,
    title: issue.title,
  });
  
  // Generate helpful response
  const sessionId = `github-${repository.full_name}-${issue.number}`;
  const context = `New issue #${issue.number}: ${issue.title}\n\n${issue.body || ''}`;
  
  const result = await answerService.answerQuestion(
    sessionId,
    `Analyze this issue and provide a helpful initial response: ${context}`,
    'Moderator'
  );
  
  if (result.blocked) {
    log.warn('New issue response blocked by guardrails');
    return;
  }
  
  // Post initial response
  const responseText = result.finalText || 'Thank you for opening this issue. We will review it shortly.';
  await addGithubIssueComment(owner, repo, issue.number, responseText);
  
  log.info('Successfully responded to new issue', {
    repo: repository.full_name,
    issueNumber: issue.number,
  });
}

/**
 * Handle issue reopened - acknowledge
 */
async function handleIssueReopened(event: GitHubWebhookEvent): Promise<void> {
  const log = logger.child({ service: 'github-issue-reopened' });
  
  if (!event.issue || !event.repository) {
    return;
  }
  
  const { issue, repository } = event;
  const [owner, repo] = repository.full_name.split('/');
  
  log.info('Issue reopened', {
    repo: repository.full_name,
    issueNumber: issue.number,
  });
  
  // Acknowledge reopening
  const responseText = `This issue has been reopened. We will review it again.`;
  await addGithubIssueComment(owner, repo, issue.number, responseText);
}

