/**
 * Tutoring Agent - Optimus Layer
 * Uses Sutradhar orchestrator for LLM and retrieval
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export class TutoringAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('TutoringAgent', 'Provides hints and answers, never full solutions', sutradharClient);
  }

  /**
   * Answer a question using LLM and retrieval via Sutradhar
   */
  async answer(question: string, context?: AgentContext): Promise<AgentResult<{ answer: string }>> {
    try {
      // Step 1: Get relevant context via retrieval agent
      const retrievalResult = await this.executeViaSutradhar(
        'retrieval-agent',
        'search',
        { query: question, maxResults: 5 },
        context
      );

      if (!retrievalResult.success) {
        return this.error('Failed to retrieve context');
      }

      const snippets = retrievalResult.data?.snippets || [];

      // Step 2: Use LLM agent to generate answer
      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a helpful tutor. Answer questions based on the provided context. Never give full solutions to coding problems.',
          user: `Context:\n${snippets.map((s: any) => s.text).join('\n\n')}\n\nQuestion: ${question}`,
        },
        context
      );

      if (!llmResult.success) {
        return this.error(llmResult.error || 'Failed to generate answer');
      }

      return this.success({
        answer: llmResult.data?.text || 'Unable to generate answer',
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to answer question');
    }
  }

  /**
   * Get a hint for a coding assignment
   */
  async getHint(assignmentPrompt: string, currentCode: string, failingTest?: string, context?: AgentContext): Promise<AgentResult<{ hint: string }>> {
    try {
      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a coding tutor. Provide hints only, never full solutions. Guide students to discover the answer themselves.',
          user: `Assignment: ${assignmentPrompt}\n\nCurrent Code:\n${currentCode}\n\n${failingTest ? `Failing Test: ${failingTest}` : ''}\n\nProvide a helpful hint.`,
        },
        context
      );

      if (!llmResult.success) {
        return this.error(llmResult.error || 'Failed to generate hint');
      }

      return this.success({
        hint: llmResult.data?.text || 'Unable to generate hint',
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to get hint');
    }
  }

  /**
   * Escalate to human support
   */
  async escalate(reason: string, email?: string, context?: AgentContext): Promise<AgentResult<{ message: string }>> {
    try {
      // Use email agent via Sutradhar
      const emailResult = await this.executeViaSutradhar(
        'email-agent',
        'send',
        {
          to: email || 'support@apex-academy.com',
          subject: 'Escalation Request',
          text: `Reason: ${reason}\n\nSession ID: ${context?.sessionId || 'unknown'}`,
        },
        context
      );

      if (!emailResult.success) {
        return this.error('Failed to send escalation email');
      }

      return this.success({
        message: 'Escalation request sent successfully',
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to escalate');
    }
  }
}
