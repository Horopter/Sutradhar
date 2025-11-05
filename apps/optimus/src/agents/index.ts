/**
 * Agent Registry
 * Central registry for all lean, single-purpose agents
 */

import { BaseAgent } from './base-agent';
import { AuthAgent } from './auth-agent';
import { CourseAgent } from './course-agent';
import { TutoringAgent } from './tutoring-agent';
import { QuizAgent } from './quiz-agent';
import { CodeAgent } from './code-agent';
import { ProgressAgent } from './progress-agent';
import { ImageAgent } from './image-agent';
import { StudyPlanAgent } from './study-plan-agent';
import { NotificationAgent } from './notification-agent';

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();

  constructor(sutradharClient?: any) {
    // Register all agents with SutradharClient
    // Note: This registry is not used in the current architecture
    // Agents are instantiated directly in routes/edtech.ts
  }

  /**
   * Register an agent
   */
  register(agent: BaseAgent): void {
    const info = agent.getInfo();
    this.agents.set(info.name, agent);
  }

  /**
   * Get an agent by name
   */
  get<T extends BaseAgent>(name: string): T | undefined {
    return this.agents.get(name) as T | undefined;
  }

  /**
   * List all registered agents
   */
  list(): Array<{ name: string; description: string; type: string }> {
    return Array.from(this.agents.values()).map(agent => agent.getInfo());
  }

  /**
   * Get agent by type
   */
  getByType<T extends BaseAgent>(type: string): T | undefined {
    for (const agent of this.agents.values()) {
      if (agent.constructor.name === type) {
        return agent as T;
      }
    }
    return undefined;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();

// Export all agents
export { AuthAgent } from './auth-agent';
export { CourseAgent } from './course-agent';
export { TutoringAgent } from './tutoring-agent';
export { QuizAgent } from './quiz-agent';
export { CodeAgent } from './code-agent';
export { ProgressAgent } from './progress-agent';
export { ImageAgent } from './image-agent';
export { StudyPlanAgent } from './study-plan-agent';
export { NotificationAgent } from './notification-agent';
export { AdaptiveLearningAgent } from './adaptive-learning-agent';
export { AnalyticsAgent } from './analytics-agent';
export { GamificationAgent } from './gamification-agent';
export { ContentGenerationAgent } from './content-generation-agent';
export { SocialAgent } from './social-agent';
export { AssessmentAgent } from './assessment-agent';

