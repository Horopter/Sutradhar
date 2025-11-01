/**
 * Answer Service - Business logic for answering questions with retrieval
 */

import { retrievalService } from './retrieval-service';
import { sessionService } from './session-service';
import { log } from '../../log';
import { guardrailRegistry } from '../guardrails/registry';
import { GuardrailContext } from '../guardrails/types';

export interface AnswerResult {
  finalText: string;
  citations: Array<{ source: string; text: string; url?: string; score?: number }>;
  latencyMs: number;
  blocked?: boolean;
  blockReason?: string;
}

export class AnswerService {
  async answerQuestion(
    sessionId: string,
    question: string,
    persona?: string
  ): Promise<AnswerResult> {
    const t0 = Date.now();

    try {
      // Create guardrail context
      const context: GuardrailContext = {
        query: question,
        sessionId,
        persona,
      };

      // Early safety and off-topic check (before retrieval)
      // NOTE: Skip pre-check for now to allow retrieval to happen first
      // The relevance check after retrieval is more accurate
      // const preCheck = await guardrailRegistry.check(context, persona || 'default');
      // if (!preCheck.allowed) {
      //   ... (keep for safety checks later)
      // }

      // Get context from retrieval
      const { snippets, mocked } = await retrievalService.search(question, 2);

      // Debug logging
      log.info('Retrieval results', {
        query: question,
        snippetsCount: snippets.length,
        snippets: snippets.map(s => ({
          source: s.source,
          score: s.score,
          textPreview: s.text.substring(0, 100)
        }))
      });

      // Update context with snippets and check relevance
      context.snippets = snippets;
      const relevanceCheck = await guardrailRegistry.check(context, persona || 'default');
      
      // Debug logging for guardrail
      log.info('Relevance guardrail check', {
        query: question,
        allowed: relevanceCheck.allowed,
        category: relevanceCheck.category,
        reason: relevanceCheck.reason,
        snippetsCount: snippets.length
      });
      if (!relevanceCheck.allowed) {
        const latencyMs = Date.now() - t0;
        
        // Log blocked message to session
        if (sessionId) {
          await sessionService.appendMessage(
            sessionId,
            'user',
            question,
            [],
            0
          );

          await sessionService.appendMessage(
            sessionId,
            'agent',
            relevanceCheck.reason || 'I cannot answer this question.',
            [],
            latencyMs
          );
        }

        log.warn('Query blocked due to low relevance', {
          sessionId,
          question,
          snippetsCount: snippets.length,
          category: relevanceCheck.category,
        });

        return {
          finalText: relevanceCheck.reason || 'I cannot answer this question.',
          citations: [],
          latencyMs,
          blocked: true,
          blockReason: relevanceCheck.reason,
        };
      }

      // Format answer with snippets
      const bullets = snippets.map(s => `• ${s.text} [${s.source}]`).join('\n');
      let finalText = `Here's what I found:\n${bullets}`;
      
      // Check if answer mentions integrations and add action suggestions
      const answerText = bullets.toLowerCase();
      const mentionsSlack = answerText.includes('slack');
      const mentionsCalendar = answerText.includes('calendar') || answerText.includes('schedule') || answerText.includes('meeting');
      const mentionsGithub = answerText.includes('github') || answerText.includes('issue') || answerText.includes('bug');
      
      if (mentionsSlack || mentionsCalendar || mentionsGithub || question.toLowerCase().includes('slack') || question.toLowerCase().includes('calendar') || question.toLowerCase().includes('github')) {
        // Use LLM to suggest appropriate actions based on context
        try {
          const { llmService } = await import('./llm-service');
          const suggestionResult = await llmService.chat({
            system: `You are a helpful assistant that suggests actionable next steps. 
When the conversation mentions Slack, Calendar, or GitHub integrations, suggest that the user can actually use these features.
Be concise and natural - suggest actions that make sense given the context.`,
            user: `User asked: "${question}"
Answer provided: "${bullets}"

Based on this context, suggest a helpful action if applicable. For example:
- If it mentions Slack: "I can send messages to Slack for you. Just say something like 'send hello to slack' or 'post X to slack'."
- If it mentions Calendar: "I can create calendar events for you. Just say 'schedule a meeting at 2pm' or 'create calendar event X'."
- If it mentions GitHub: "I can create GitHub issues for you. Just say 'create a GitHub issue for X' or 'file a bug about Y'."
- If multiple are mentioned, suggest all relevant actions.
- If none are mentioned but the question is about actions/integrations, provide general guidance.

Keep it to one or two sentences. If no action suggestion is relevant, respond with just "Need anything else?"`,
          });
          
          if (suggestionResult.ok && suggestionResult.data?.text) {
            finalText += `\n\n${suggestionResult.data.text.trim()}`;
          } else {
            finalText += `\n\nNeed anything else?`;
          }
        } catch (error) {
          log.warn('Failed to generate action suggestion', error);
          finalText += `\n\nNeed anything else?`;
        }
      } else {
        finalText += `\n\nNeed anything else?`;
      }

      const latencyMs = Date.now() - t0;

      // Log messages to session
      if (sessionId) {
        await sessionService.appendMessage(
          sessionId,
          'user',
          question,
          [],
          0
        );

        await sessionService.appendMessage(
          sessionId,
          'agent',
          finalText,
          snippets.map(s => ({
            type: 'file',
            id: s.source,
            title: s.source,
            url: s.url,
          })),
          latencyMs
        );
      }

      log.info('Answer generated', {
        sessionId,
        questionLength: question.length,
        snippetsCount: snippets.length,
        latencyMs,
        mocked,
      });

      return {
        finalText,
        citations: snippets.map(s => ({
          source: s.source,
          text: s.text,
          url: s.url,
          score: s.score,
        })),
        latencyMs,
      };
    } catch (error) {
      log.error('Answer service error', error);
      throw error;
    }
  }
}

export const answerService = new AnswerService();

