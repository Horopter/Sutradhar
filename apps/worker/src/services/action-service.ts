/**
 * Action Service (Unified)
 * Unified interface for creating and managing tasks, issues, and events
 * Abstracts GitHub, Calendar, and other action platforms
 */

import { createGithubIssue, updateGithubIssue, getGithubIssue } from '../integrations/actions/github';
import { Task, Issue, Event, TaskResult, TaskUpdate } from '../models/action';
import { log } from '../log';
import { logger } from '../core/logging/logger';

export class UnifiedActionService {
  /**
   * Create a task (issue, event, etc.)
   */
  async createTask(task: Task): Promise<TaskResult> {
    const serviceLogger = logger.child({ service: 'action', operation: 'createTask' });
    
    try {
      switch (task.type) {
        case 'issue':
          return await this._createIssue(task as Issue);
        
        case 'event':
          return await this._createEvent(task as Event);
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error: any) {
      serviceLogger.error('Create task failed', { error: error.message, taskType: task.type });
      return {
        success: false,
        taskId: '',
        type: task.type,
        error: error.message,
      };
    }
  }

  /**
   * Update a task
   */
  async updateTask(id: string, task: Task, updates: TaskUpdate): Promise<TaskResult> {
    const serviceLogger = logger.child({ service: 'action', operation: 'updateTask' });
    
    try {
      switch (task.type) {
        case 'issue':
          return await this._updateIssue(id, task as Issue, updates);
        
        case 'event':
          return await this._updateEvent(id, task as Event, updates);
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error: any) {
      serviceLogger.error('Update task failed', { error: error.message, taskType: task.type });
      return {
        success: false,
        taskId: id,
        type: task.type,
        error: error.message,
      };
    }
  }

  /**
   * Get a task by ID
   */
  async getTask(id: string, type: Task['type'], metadata?: { repository?: string; calendarId?: string }): Promise<Task | null> {
    try {
      switch (type) {
        case 'issue':
          if (!metadata?.repository) throw new Error('Repository required for issue');
          return await this._getIssue(id, metadata.repository);
        
        case 'event':
          if (!metadata?.calendarId) throw new Error('Calendar ID required for event');
          return await this._getEvent(id, metadata.calendarId);
        
        default:
          return null;
      }
    } catch (error: any) {
      log.error('Get task failed', { error: error.message, type, id });
      return null;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string, type: Task['type'], metadata?: { calendarId?: string }): Promise<boolean> {
    try {
      switch (type) {
        case 'event':
          if (!metadata?.calendarId) throw new Error('Calendar ID required');
          const { deleteCalendarEvent } = await import('../integrations/actions/calendar');
          await deleteCalendarEvent(metadata.calendarId, id);
          return true;
        
        default:
          // GitHub issues are closed, not deleted
          return false;
      }
    } catch (error: any) {
      log.error('Delete task failed', { error: error.message, type, id });
      return false;
    }
  }

  // Private helper methods

  private async _createIssue(issue: Issue): Promise<TaskResult> {
    try {
      const [owner, repo] = issue.repository.split('/');
      if (!owner || !repo) {
        throw new Error(`Invalid repository format: ${issue.repository}`);
      }

      const result: any = await createGithubIssue(issue.title, issue.description || '', issue.repository);
      // safeAction returns { ok, mocked, type, payload, result }
      const safeActionResult = result as any;
      const actionResult = safeActionResult.result || result;
      const issueData = actionResult?.data || actionResult?.result?.data || actionResult || result;
      const issueNumber = issueData.number || actionResult?.number || result.number || result.result?.number || result.issue_number;

      const taskResult: TaskResult = {
        success: true,
        taskId: issueNumber ? issueNumber.toString() : 'unknown',
        type: 'issue',
        url: issueData.html_url || result.html_url || result.result?.html_url || result.url || (issueNumber ? `https://github.com/${owner}/${repo}/issues/${issueNumber}` : ''),
        metadata: {
          repository: issue.repository,
          number: issueNumber,
        },
      };
      return taskResult;
    } catch (error: any) {
      throw new Error(`Create issue failed: ${error.message}`);
    }
  }

  private async _createEvent(event: Event): Promise<TaskResult> {
    try {
      const { createCalendarEvent } = await import('../integrations/actions/calendar');
      // createCalendarEvent signature: (title, startISO, endISO, description, calendarId?)
      const result: any = await createCalendarEvent(
        event.title,
        new Date(event.startTime).toISOString(),
        new Date(event.endTime).toISOString(),
        event.description || '',
        event.calendar
      );

      // safeAction returns { ok, mocked, type, payload, result }
      const safeActionResult = result as any;
      const actionResult = safeActionResult.result || result;
      const eventData = actionResult?.data || actionResult?.result?.data || actionResult || result;
      const taskResult: TaskResult = {
        success: true,
        taskId: eventData.id || actionResult?.id || result.id || result.eventId || result.result?.id || '',
        type: 'event',
        url: eventData.htmlLink || actionResult?.htmlLink || result.htmlLink || result.result?.htmlLink || result.url || '',
        metadata: {
          calendarId: event.calendar,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      };
      return taskResult;
    } catch (error: any) {
      throw new Error(`Create event failed: ${error.message}`);
    }
  }

  private async _updateIssue(id: string, issue: Issue, updates: TaskUpdate): Promise<TaskResult> {
    try {
      const [owner, repo] = issue.repository.split('/');
      if (!owner || !repo) {
        throw new Error(`Invalid repository format: ${issue.repository}`);
      }

      const issueNumber = parseInt(id, 10);
      if (isNaN(issueNumber)) {
        throw new Error(`Invalid issue number: ${id}`);
      }

      const title = updates.title !== undefined ? updates.title : issue.title;
      const body = updates.description !== undefined ? updates.description : issue.description;

      const result: any = await updateGithubIssue(owner, repo, issueNumber, {
        title,
        body,
        state: updates.status === 'completed' ? 'closed' : 'open',
      });

      return {
        success: true,
        taskId: id,
        type: 'issue',
        url: result.html_url || result.url,
        metadata: result,
      };
    } catch (error: any) {
      throw new Error(`Update issue failed: ${error.message}`);
    }
  }

  private async _getEvent(id: string, calendarId: string): Promise<Event | null> {
    try {
      const { getCalendarEvent } = await import('../integrations/actions/calendar');
      const result: any = await getCalendarEvent(calendarId, id);
      
      if (!result) {
        return null;
      }

      return {
        id: result.id || id,
        type: 'event',
        title: result.summary || result.title || '',
        description: result.description,
        status: result.status === 'cancelled' ? 'cancelled' : 'pending',
        calendar: calendarId,
        startTime: result.start?.dateTime ? new Date(result.start.dateTime).getTime() : Date.now(),
        endTime: result.end?.dateTime ? new Date(result.end.dateTime).getTime() : Date.now(),
        location: result.location,
        attendees: result.attendees?.map((a: any) => a.email) || [],
        metadata: {
          url: result.htmlLink,
          timezone: result.start?.timeZone,
        },
      };
    } catch (error: any) {
      log.error('Get event failed', { error: error.message, id, calendarId });
      return null;
    }
  }

  private async _updateEvent(id: string, event: Event, updates: TaskUpdate): Promise<TaskResult> {
    try {
      const { getCalendarEvent, updateCalendarEvent } = await import('../integrations/actions/calendar');
      
      // Get existing event first to preserve fields
      const existing: any = await getCalendarEvent(event.calendar, id);

      // updateCalendarEvent signature: (calendarId, eventId, params)
      const updateParams: any = {};
      if (updates.title !== undefined) updateParams.summary = updates.title;
      if (updates.description !== undefined) updateParams.description = updates.description;
      if (updates.dueDate) {
        updateParams.start_datetime = new Date(updates.dueDate).toISOString();
        updateParams.end_datetime = new Date(updates.dueDate + 3600000).toISOString(); // +1 hour default
      }

      const result: any = await updateCalendarEvent(event.calendar, id, updateParams);

      return {
        success: true,
        taskId: id,
        type: 'event',
        url: result.htmlLink || result.url,
        metadata: result,
      };
    } catch (error: any) {
      throw new Error(`Update event failed: ${error.message}`);
    }
  }

  private async _getIssue(id: string, repository: string): Promise<Issue | null> {
    try {
      const { getGithubIssue } = await import('../integrations/actions/github');
      const [owner, repo] = repository.split('/');
      if (!owner || !repo) {
        return null;
      }

      const issueNumber = parseInt(id, 10);
      if (isNaN(issueNumber)) {
        return null;
      }

      const result: any = await getGithubIssue(owner, repo, issueNumber);

      // Handle safeAction wrapper and nested data structure
      const safeActionResult = result as any;
      const actionResult = safeActionResult.result || result;
      const issueData = actionResult?.data || actionResult || result;

      return {
        id: issueNumber.toString(),
        type: 'issue',
        title: issueData.title || actionResult?.title || result.title || '',
        description: issueData.body || actionResult?.body || result.body || '',
        status: ((issueData.state || actionResult?.state || result.state) === 'open') ? 'pending' : 'completed',
        repository,
        metadata: {
          url: issueData.html_url || actionResult?.html_url || result.html_url,
          number: issueNumber,
          state: issueData.state || actionResult?.state || result.state,
          labels: (issueData.labels || actionResult?.labels || result.labels)?.map((l: any) => l.name || l) || [],
        },
      } as Issue;
    } catch (error: any) {
      log.error('Get issue failed', { error: error.message, id, repository });
      return null;
    }
  }
}

export const unifiedActionService = new UnifiedActionService();

