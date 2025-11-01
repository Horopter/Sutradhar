/**
 * Action Domain Models
 * Unified models for tasks, issues, events, and actions
 */

export interface Task {
  id?: string;
  type: 'issue' | 'event' | 'message' | 'custom';
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: number;
  metadata?: Record<string, any>;
}

export interface Issue extends Task {
  type: 'issue';
  repository: string;
  labels?: string[];
  metadata?: {
    url?: string;
    number?: number;
    state?: 'open' | 'closed';
    [key: string]: any;
  };
}

export interface Event extends Task {
  type: 'event';
  calendar: string;
  startTime: number;
  endTime: number;
  location?: string;
  attendees?: string[];
  metadata?: {
    url?: string;
    timezone?: string;
    [key: string]: any;
  };
}

export interface TaskResult {
  success: boolean;
  taskId: string;
  type: string;
  url?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assignee?: string;
  dueDate?: number;
  metadata?: Record<string, any>;
}

