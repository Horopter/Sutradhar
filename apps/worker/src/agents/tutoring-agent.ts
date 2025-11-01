/**
 * Tutoring Agent
 * Single responsibility: Provide hints and answers (never full solutions)
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { llmService } from '../core/services/llm-service';
import { log } from '../log';

// Import conversation service instance
let conversationServiceInstance: any = null;

async function getConversationService() {
  if (!conversationServiceInstance) {
    const { conversationService } = await import('../services/conversation-service');
    conversationServiceInstance = conversationService;
  }
  return conversationServiceInstance;
}

export class TutoringAgent extends BaseAgent {
  constructor() {
    super('TutoringAgent', 'Provides hints and answers, never full solutions');
  }

  /**
   * Answer a question (general Q&A)
   */
  async answer(question: string, context?: AgentContext): Promise<AgentResult<{ text: string; sources: any[] }>> {
    try {
      const sessionId = context?.sessionId || 'demo-session';
      const conversationService = await getConversationService();
      
      const answer = await conversationService.ask(question, {
        sessionId,
        persona: context?.persona || 'default'
      });
      
      return this.success({
        text: answer.text,
        sources: answer.sources || []
      });
    } catch (error: any) {
      log.error('TutoringAgent.answer failed', error);
      return this.error(error.message || 'Failed to get answer');
    }
  }

  /**
   * Get a hint for coding assignment (hint-only, never full solution)
   */
  async getHint(
    assignmentPrompt: string,
    currentCode: string,
    failingTest?: string,
    context?: AgentContext
  ): Promise<AgentResult<{ hint: string }>> {
    try {
      const systemPrompt = `You are a coding tutor. Provide hints and Socratic questions. **Never write the full solution.** 
If code is requested, show at most a 3-line snippet or pseudocode; redact the rest.
Focus on guiding the student to discover the solution themselves.
Do not provide complete functions or implementations.`;

      const userPrompt = `Assignment: ${assignmentPrompt}\n\nStudent's current code:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\n${failingTest ? `Failing test: ${failingTest}` : 'Provide a hint to get started.'}`;
      
      const result = await llmService.chat({
        system: systemPrompt,
        user: userPrompt
      });
      
      if (!result.ok || !result.data) {
        return this.error(result.error || 'Failed to generate hint');
      }
      
      let hintText = result.data.text || '';
      
      // Redact guard: if response has > 5 lines of code, truncate middle
      const codeBlockRegex = /```[\s\S]*?```/g;
      hintText = hintText.replace(codeBlockRegex, (match) => {
        const lines = match.split('\n');
        if (lines.length > 7) {
          return lines.slice(0, 3).join('\n') + '\n[... code redacted ...]\n' + lines.slice(-3).join('\n');
        }
        return match;
      });
      
      return this.success({ hint: hintText });
    } catch (error: any) {
      log.error('TutoringAgent.getHint failed', error);
      return this.error(error.message || 'Failed to get hint');
    }
  }

  /**
   * Escalate to human support
   */
  async escalate(reason: string, email?: string, context?: AgentContext): Promise<AgentResult<{ text: string; sent: boolean }>> {
    try {
      const escalateResult = await llmService.chat({
        system: `Draft an escalation email for: ${reason}`,
        user: reason
      });
      
      let sent = false;
      if (email && escalateResult.ok && escalateResult.data) {
        const { emailService } = await import('../core/services/email-service');
        await emailService.sendEmail({
          to: email,
          subject: '[Escalation] Apex Academy Support',
          text: escalateResult.data.text || reason
        });
        sent = true;
      }
      
      return this.success({
        text: escalateResult.data?.text || reason,
        sent
      });
    } catch (error: any) {
      log.error('TutoringAgent.escalate failed', error);
      return this.error(error.message || 'Failed to escalate');
    }
  }
}

