/**
 * Code Agent
 * Single responsibility: Handle coding assignments and code execution
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { log } from '../log';

export interface CodeRunRequest {
  code: string;
  language: string;
  assignmentId: string;
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
  constructor() {
    super('CodeAgent', 'Handles coding assignments and code execution');
  }

  /**
   * Get a coding assignment
   */
  async getAssignment(assignmentId: string, context?: AgentContext): Promise<AgentResult<any>> {
    try {
      const assignment = await Convex.queries('codeAssignments:get', { assignmentId });
      
      if (!assignment) {
        return this.error('Assignment not found');
      }
      
      return this.success(assignment);
    } catch (error: any) {
      log.error('CodeAgent.getAssignment failed', error);
      return this.error(error.message || 'Failed to get assignment');
    }
  }

  /**
   * Run code against tests (with sandboxing)
   */
  async runCode(request: CodeRunRequest, context?: AgentContext): Promise<AgentResult<CodeRunResult>> {
    try {
      const assignment = await Convex.queries('codeAssignments:get', { assignmentId: request.assignmentId });
      
      if (!assignment) {
        return this.error('Assignment not found');
      }
      
      const tests = assignment.tests || [];
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
            // This is a simplified test runner - replace with proper sandbox in production
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
      log.error('CodeAgent.runCode failed', error);
      return this.error(error.message || 'Failed to run code');
    }
  }

  /**
   * Save code submission
   */
  async saveSubmission(
    userId: string,
    assignmentId: string,
    code: string,
    results: CodeRunResult,
    context?: AgentContext
  ): Promise<AgentResult<{ submissionId: string }>> {
    try {
      await Convex.mutations('codeSubmissions:create', {
        userId,
        assignmentId,
        code,
        results
      });
      
      // Log event
      await Convex.mutations('events:log', {
        userId,
        type: 'code_submit',
        payload: { assignmentId, passed: results.passed === results.total }
      });
      
      return this.success({ submissionId: 'saved' });
    } catch (error: any) {
      log.error('CodeAgent.saveSubmission failed', error);
      return this.error(error.message || 'Failed to save submission');
    }
  }
}

