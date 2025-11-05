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
   * Enhanced with Socratic method and multi-turn conversation support
   */
  async answer(
    question: string,
    context?: AgentContext
  ): Promise<AgentResult<{ answer: string; method?: 'direct' | 'socratic'; followUp?: string }>> {
    try {
      // Get conversation history if available
      const conversationHistory = context?.conversationHistory || [];
      
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

      // Determine if Socratic method should be used (for learning questions, not factual)
      const shouldUseSocratic = this.shouldUseSocraticMethod(question, context);

      const systemPrompt = shouldUseSocratic
        ? 'You are a Socratic tutor. Instead of giving direct answers, ask leading questions that guide students to discover the answer themselves. Encourage critical thinking. Only provide hints, not full solutions.'
        : 'You are a helpful tutor. Answer questions based on the provided context. For coding problems, provide guidance but never give full solutions.';

      const userPrompt = `Context:\n${snippets.map((s: any) => s.text).join('\n\n')}\n\nQuestion: ${question}${conversationHistory.length > 0 ? `\n\nPrevious conversation:\n${conversationHistory.slice(-3).map((m: any) => `${m.role}: ${m.content}`).join('\n')}` : ''}`;

      // Step 2: Use LLM agent to generate answer
      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: systemPrompt,
          user: userPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success) {
        return this.error(llmResult.error || 'Failed to generate answer');
      }

      const answer = llmResult.data?.text || 'Unable to generate answer';

      // Generate follow-up question if using Socratic method
      let followUp: string | undefined;
      if (shouldUseSocratic) {
        const followUpResult = await this.executeViaSutradhar(
          'llm-agent',
          'chat',
          {
            system: 'Generate a follow-up question that encourages deeper thinking about the topic.',
            user: `Topic: ${question}\nAnswer given: ${answer}\n\nGenerate a thought-provoking follow-up question.`,
            provider: 'openai',
            model: 'gpt-4o-mini'
          },
          context
        );

        if (followUpResult.success) {
          followUp = followUpResult.data?.text || undefined;
        }
      }

      return this.success({
        answer,
        method: shouldUseSocratic ? 'socratic' : 'direct',
        followUp
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to answer question');
    }
  }

  /**
   * Determine if Socratic method should be used
   */
  private shouldUseSocraticMethod(question: string, context?: AgentContext): boolean {
    // Use Socratic method for conceptual questions, not factual ones
    const socraticKeywords = ['why', 'how', 'explain', 'understand', 'learn', 'think', 'concept'];
    const factualKeywords = ['what is', 'define', 'when', 'where', 'who'];
    
    const lowerQuestion = question.toLowerCase();
    
    const hasSocraticKeyword = socraticKeywords.some(kw => lowerQuestion.includes(kw));
    const hasFactualKeyword = factualKeywords.some(kw => lowerQuestion.includes(kw));
    
    // Use Socratic if it's a learning question and not a pure definition
    return hasSocraticKeyword && !hasFactualKeyword;
  }

  /**
   * Analyze code in real-time as student types
   */
  async analyzeCode(
    code: string,
    assignmentPrompt: string,
    context?: AgentContext
  ): Promise<AgentResult<{ suggestions: string[]; errors: string[]; warnings: string[] }>> {
    try {
      const analysisPrompt = `Analyze this code in real-time:

Assignment: ${assignmentPrompt}

Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Syntax errors (if any)
2. Logic warnings (potential issues)
3. Style suggestions

Return JSON: {errors: string[], warnings: string[], suggestions: string[]}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a code analyzer. Return only valid JSON.',
          user: analysisPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to analyze code');
      }

      let analysis: any;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        analysis = { errors: [], warnings: [], suggestions: [] };
      }

      return this.success({
        suggestions: analysis.suggestions || [],
        errors: analysis.errors || [],
        warnings: analysis.warnings || []
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to analyze code');
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
