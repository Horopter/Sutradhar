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
        submittedAt: Date.now()
      });
      
      return this.success({ saved: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to save submission');
    }
  }
}
