/**
 * Relevance Guardrail - Validates that retrieved snippets match the query
 */

import { IGuardrail, GuardrailContext, GuardrailResult, GuardrailConfig } from '../types';
import { log } from '../../../log';

export class RelevanceGuardrail implements IGuardrail {
  name = 'relevance';
  category = 'relevance' as const;
  description = 'Validates that retrieved snippets are relevant to the query';

  private readonly stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might',
    'must', 'this', 'that', 'these', 'those', 'a', 'an', 'for', 'with', 'about',
    'what', 'who', 'where', 'when', 'why', 'how', 'to', 'of', 'in', 'on', 'at', 'by'
    // Note: 'known' and 'issues' are NOT stop words - they're meaningful for queries like "known issues"
  ]);

  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    const snippets = context.snippets || [];
    const minScore = (config?.minScore as number) ?? 0.2; // Lowered threshold
    const minRelevanceRatio = (config?.minRelevanceRatio as number) ?? 0.2; // Lowered threshold for better recall

    if (snippets.length === 0) {
      return {
        allowed: false,
        reason: config?.noResultsMessage || 'I couldn\'t find relevant information in my knowledge base to answer your question. I can only answer questions related to our product, support documentation, and policies.',
        category: 'relevance',
        severity: 'medium',
      };
    }

    // Extract meaningful query terms - be more lenient
    const queryWords = context.query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !this.stopWords.has(w));

    if (queryWords.length === 0) {
      return {
        allowed: false,
        reason: config?.noResultsMessage || 'I couldn\'t find relevant information in my knowledge base to answer your question.',
        category: 'relevance',
        severity: 'medium',
      };
    }

    // Check if all snippets have scores below threshold
    const hasScores = snippets.some(s => s.score !== undefined);
    if (hasScores) {
      const allLowRelevance = snippets.every(s => (s.score || 0) < minScore);
      if (allLowRelevance) {
        return {
          allowed: false,
          reason: config?.lowRelevanceMessage || 'I couldn\'t find relevant information in my knowledge base to answer your question.',
          category: 'relevance',
          severity: 'medium',
        };
      }
    }

    // Keyword-based relevance check - be more lenient
    const snippetRelevance = snippets.map(snippet => {
      const snippetText = snippet.text.toLowerCase();
      const matchingWords = queryWords.filter(word => snippetText.includes(word));
      // Use at least 1 match OR check if it's a high-scoring snippet
      const relevanceRatio = queryWords.length > 0 
        ? matchingWords.length / queryWords.length 
        : (snippet.score || 0) > minScore ? 1.0 : 0;
      return { snippet, relevanceRatio, matchingWords };
    });

    // Check for default/fallback snippets
    const fallbackPatterns = (config?.fallbackPatterns as RegExp[]) || [
      /business plan includes/i,
      /upload.*via web/i,
      /suggest.*desktop app/i,
    ];
    const hasOnlyFallbacks = snippets.every(s => {
      return fallbackPatterns.some(pattern => pattern.test(s.text));
    });

    if (hasOnlyFallbacks) {
      const hasRelevantMatch = snippetRelevance.some(sr => sr.relevanceRatio > minRelevanceRatio);
      if (!hasRelevantMatch) {
        return {
          allowed: false,
          reason: config?.lowRelevanceMessage || 'I couldn\'t find relevant information in my knowledge base to answer your question.',
          category: 'relevance',
          severity: 'medium',
        };
      }
    }

    // Check if at least one snippet has significant relevance
    // OR if snippets have good scores (from BM25/vector search)
    const hasRelevantSnippet = snippetRelevance.some(sr => sr.relevanceRatio >= minRelevanceRatio);
    const hasGoodScores = snippets.some(s => (s.score || 0) > minScore);
    
    if (!hasRelevantSnippet && !hasGoodScores) {
      // Log for debugging
      log.warn('Guardrail rejected: low relevance', {
        query: context.query,
        queryWords,
        snippets: snippets.map(s => ({
          source: s.source,
          score: s.score,
          textPreview: s.text.substring(0, 50)
        })),
        relevanceRatios: snippetRelevance.map(sr => sr.relevanceRatio)
      });
      
      return {
        allowed: false,
        reason: config?.lowRelevanceMessage || 'I couldn\'t find relevant information in my knowledge base to answer your question.',
        category: 'relevance',
        severity: 'medium',
      };
    }

    return { allowed: true, category: 'relevance' };
  }
}

