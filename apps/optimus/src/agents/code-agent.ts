/**
 * Code Agent - Optimus Layer
 * Uses Sutradhar orchestrator for data operations
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface CodeRunRequest {
  assignmentId: string;
  code: string;
  language: string;
}

export interface CodeRunResult {
  passed: number;
  total: number;
  cases: Array<{
    name: string;
    passed: boolean;
    error?: string;
    expected?: any;
    actual?: any;
  }>;
}

export class CodeAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('CodeAgent', 'Handles coding assignments and code execution', sutradharClient);
  }

  /**
   * Get coding assignment
   */
  async getAssignment(assignmentId: string, context?: AgentContext): Promise<AgentResult<any>> {
    try {
      // Use Sutradhar data-agent for assignment retrieval
      const assignment = await this.convexQuery('codeAssignments:get', { assignmentId: assignmentId }, context);
      
      if (!assignment) {
        return this.error('Assignment not found');
      }
      
      return this.success(assignment);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get assignment');
    }
  }

  /**
   * Run code against tests
   */
  async runCode(request: CodeRunRequest, context?: AgentContext): Promise<AgentResult<CodeRunResult>> {
    try {
      // Get assignment first
      const assignmentResult = await this.getAssignment(request.assignmentId, context);
      if (!assignmentResult.success || !assignmentResult.data) {
        return this.error('Assignment not found');
      }
      
      const assignment: any = assignmentResult.data;
      const tests = (assignment.tests || []) as Array<{ name: string; code: string; expected?: any; actual?: any }>;
      const results: CodeRunResult['cases'] = [];
      let passed = 0;
      
      // Basic sandboxing for JavaScript/Node.js
      if (request.language === 'javascript' || request.language === 'node') {
        // Strip dangerous patterns
        if (request.code.includes('require(') || 
            request.code.includes('import(') || 
            request.code.includes('eval(') || 
            request.code.includes('process.')) {
          return this.error('Code contains disallowed patterns (require, import, eval, process)');
        }
        
        // Run tests (simplified - use proper sandbox in production)
        for (const test of tests) {
          try {
            const testFn = new Function('code', `return (${test.code})(code)`);
            const testPassed = testFn(request.code);
            results.push({
              name: test.name,
              passed: testPassed,
              expected: test.expected,
              actual: test.actual
            });
            if (testPassed) passed++;
          } catch (error: any) {
            results.push({
              name: test.name,
              passed: false,
              error: error.message
            });
          }
        }
      } else {
        return this.error(`${request.language} runner not yet implemented`);
      }
      
      return this.success({
        passed,
        total: tests.length,
        cases: results
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to run code');
    }
  }

  /**
   * Save code submission
   */
  async saveSubmission(userId: string, assignmentId: string, code: string, results: CodeRunResult, context?: AgentContext): Promise<AgentResult<{ saved: boolean }>> {
    try {
      // Use Sutradhar data-agent
      await this.convexMutation('codeSubmissions:create', {
        userId,
        assignmentId,
        code,
        results,
        createdAt: Date.now()
      }, context);
      
      return this.success({ saved: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to save submission');
    }
  }

  /**
   * Analyze code for security vulnerabilities
   */
  async analyzeSecurity(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<{ vulnerabilities: Array<{ type: string; severity: string; description: string; line?: number }> }>> {
    try {
      const securityPrompt = `Analyze this ${language} code for security vulnerabilities:

\`\`\`${language}
${code}
\`\`\`

Return JSON array: [{type: string, severity: "low"|"medium"|"high"|"critical", description: string, line?: number}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a security expert. Return only valid JSON array.',
          user: securityPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to analyze security');
      }

      let vulnerabilities: any[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        vulnerabilities = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        vulnerabilities = [];
      }

      return this.success({ vulnerabilities });
    } catch (error: any) {
      return this.error(error.message || 'Failed to analyze security');
    }
  }

  /**
   * Check code style and best practices
   */
  async checkStyle(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<{ styleIssues: Array<{ type: string; message: string; suggestion: string }> }>> {
    try {
      const stylePrompt = `Check code style and best practices for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Return JSON array: [{type: "naming"|"formatting"|"structure"|"performance", message: string, suggestion: string}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a code style expert. Return only valid JSON array.',
          user: stylePrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to check style');
      }

      let styleIssues: any[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        styleIssues = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        styleIssues = [];
      }

      return this.success({ styleIssues });
    } catch (error: any) {
      return this.error(error.message || 'Failed to check style');
    }
  }

  /**
   * Get code explanation
   */
  async explainCode(
    code: string,
    language: string,
    context?: AgentContext
  ): Promise<AgentResult<{ explanation: string; lineByLine?: Array<{ line: number; explanation: string }> }>> {
    try {
      const explainPrompt = `Explain this ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Overall explanation
2. Line-by-line breakdown (for code under 50 lines)

Return JSON: {explanation: string, lineByLine?: [{line: number, explanation: string}]}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert code explainer. Return only valid JSON.',
          user: explainPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to explain code');
      }

      let explanation: any;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        explanation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        explanation = { explanation: 'Unable to generate explanation' };
      }

      return this.success(explanation);
    } catch (error: any) {
      return this.error(error.message || 'Failed to explain code');
    }
  }
}
