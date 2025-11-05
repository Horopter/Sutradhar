/**
 * Guardrail Registry - Manages pluggable guardrails
 * Production-ready with caching, metrics, and error handling
 */

import { IGuardrail, GuardrailContext, GuardrailResult, PersonaGuardrailConfig, GuardrailConfig } from './types';
import { log } from '../../log';
import { cache } from '../cache';
import { circuitBreakerRegistry } from '../circuit-breaker';

// Metrics tracking
interface GuardrailMetrics {
  totalChecks: number;
  blocked: number;
  allowed: number;
  errors: number;
  latency: number[]; // For percentile calculation
  byCategory: Record<string, number>;
}

export class GuardrailRegistry {
  private guardrails: Map<string, IGuardrail> = new Map();
  private personaConfigs: Map<string, PersonaGuardrailConfig> = new Map();
  private metrics: Map<string, GuardrailMetrics> = new Map();
  private circuitBreaker = circuitBreakerRegistry.get('guardrails', {
    failureThreshold: 10,
    resetTimeout: 30000,
  });

  /**
   * Register a guardrail
   */
  register(guardrail: IGuardrail): void {
    if (this.guardrails.has(guardrail.name)) {
      log.warn(`Guardrail ${guardrail.name} already registered, overwriting`);
    }
    this.guardrails.set(guardrail.name, guardrail);
    log.info(`Registered guardrail: ${guardrail.name} (${guardrail.category})`);
  }

  /**
   * Unregister a guardrail
   */
  unregister(name: string): boolean {
    return this.guardrails.delete(name);
  }

  /**
   * Get a guardrail by name
   */
  get(name: string): IGuardrail | undefined {
    return this.guardrails.get(name);
  }

  /**
   * List all registered guardrails
   */
  list(): IGuardrail[] {
    return Array.from(this.guardrails.values());
  }

  /**
   * List guardrails by category
   */
  listByCategory(category: string): IGuardrail[] {
    return this.list().filter(g => g.category === category);
  }

  /**
   * Configure guardrails for a persona with validation
   */
  configurePersona(persona: string, config: PersonaGuardrailConfig): void {
    // Validate configuration
    if (!Array.isArray(config.enabled)) {
      throw new Error('Persona config must have enabled array');
    }

    // Validate that all enabled guardrails exist
    const unknown = config.enabled.filter(name => !this.guardrails.has(name));
    if (unknown.length > 0) {
      log.warn(`Persona ${persona} references unknown guardrails: ${unknown.join(', ')}`);
    }

    // Normalize persona name
    const normalizedPersona = persona.toLowerCase();
    this.personaConfigs.set(normalizedPersona, {
      ...config,
      enabled: config.enabled.filter(name => this.guardrails.has(name)), // Only keep valid guardrails
    });

    log.info(`Configured guardrails for persona: ${normalizedPersona}`, {
      enabled: config.enabled.length,
      guardrails: config.enabled,
    });
  }

  /**
   * Get persona configuration
   */
  getPersonaConfig(persona?: string): PersonaGuardrailConfig | undefined {
    if (!persona) return undefined;
    return this.personaConfigs.get(persona.toLowerCase());
  }

  /**
   * Check guardrails for a query with caching and circuit breaker protection
   */
  async check(
    context: GuardrailContext,
    persona?: string
  ): Promise<GuardrailResult> {
    const startTime = Date.now();
    const personaName = persona || 'default';
    const queryHash = this.hashQuery(context.query);
    
    // Try cache for identical queries (short TTL to handle updates)
    const cacheKey = `guardrail:${personaName}:${queryHash}`;
    try {
      const cached = await cache.get<GuardrailResult>(cacheKey);
      if (cached) {
        this.recordMetrics('cache_hit', 'custom', Date.now() - startTime, cached.allowed);
        return cached;
      }
    } catch (error) {
      log.warn('Cache read failed for guardrails, continuing', error);
    }

    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await this.executeGuardrails(context, personaName);
      });

      // Cache allowed results for short time (1 minute)
      if (result.allowed) {
        try {
          await cache.set(cacheKey, result, 60);
        } catch (error) {
          log.warn('Cache write failed for guardrails', error);
        }
      }

      const latency = Date.now() - startTime;
      this.recordMetrics('guardrail_check', result.category, latency, result.allowed);
      
      return result;
    } catch (error) {
      log.error('Guardrail check failed', error);
      this.recordMetrics('guardrail_error', 'custom', Date.now() - startTime, false);
      
      // Graceful degradation: allow query if guardrail system fails
      // In strict mode, could reject instead
      return {
        allowed: true,
        category: 'custom',
        metadata: { degraded: true, error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Execute guardrails (internal, without circuit breaker)
   */
  private async executeGuardrails(
    context: GuardrailContext,
    personaName: string
  ): Promise<GuardrailResult> {
    const personaConfig = this.getPersonaConfig(personaName);
    const enabledGuardrails = personaConfig?.enabled || this.list().map(g => g.name);

    // Run guardrails in order (safety first, then others)
    const sortedGuardrails = enabledGuardrails
      .map(name => this.guardrails.get(name))
      .filter((g): g is IGuardrail => g !== undefined)
      .sort((a, b) => {
        // Safety checks first
        if (a.category === 'safety') return -1;
        if (b.category === 'safety') return 1;
        // Then relevance before off_topic
        if (a.category === 'relevance' && b.category === 'off_topic') return -1;
        if (b.category === 'relevance' && a.category === 'off_topic') return 1;
        return 0;
      });

    for (const guardrail of sortedGuardrails) {
      const config = personaConfig?.guardrails?.[guardrail.name] || { enabled: true };
      
      if (!config.enabled) {
        continue;
      }

      try {
        const checkStart = Date.now();
        const result = await guardrail.check(context, config);
        const checkLatency = Date.now() - checkStart;
        
        // Record per-guardrail metrics
        this.recordGuardrailMetrics(guardrail.name, result.category, checkLatency, result.allowed);
        
        if (!result.allowed) {
          log.warn('Query blocked by guardrail', {
            guardrail: guardrail.name,
            category: result.category,
            severity: result.severity,
            sessionId: context.sessionId,
            latency: checkLatency,
          });
          return result;
        }
      } catch (error) {
        log.error(`Guardrail ${guardrail.name} threw error`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          sessionId: context.sessionId,
        });
        
        // Record error but continue to next guardrail
        this.recordGuardrailMetrics(guardrail.name, 'custom', 0, false);
        
        // Only fail if it's a safety guardrail
        if (guardrail.category === 'safety') {
          // Safety guardrails failing is critical - block query
          return {
            allowed: false,
            reason: 'Safety validation system error. Query cannot be processed.',
            category: 'safety',
            severity: 'critical',
          };
        }
      }
    }

    return { allowed: true, category: 'custom' };
  }

  /**
   * Record metrics for guardrail checks
   */
  private recordMetrics(operation: string, category: string, latency: number, allowed: boolean): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        totalChecks: 0,
        blocked: 0,
        allowed: 0,
        errors: 0,
        latency: [],
        byCategory: {},
      });
    }

    const metrics = this.metrics.get(operation)!;
    metrics.totalChecks++;
    if (allowed) {
      metrics.allowed++;
    } else {
      metrics.blocked++;
    }
    
    metrics.latency.push(latency);
    // Keep only last 1000 latency measurements
    if (metrics.latency.length > 1000) {
      metrics.latency = metrics.latency.slice(-1000);
    }
    
    metrics.byCategory[category] = (metrics.byCategory[category] || 0) + 1;
  }

  /**
   * Record metrics for individual guardrails
   */
  private recordGuardrailMetrics(name: string, category: string, latency: number, allowed: boolean): void {
    this.recordMetrics(`guardrail:${name}`, category, latency, allowed);
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): Record<string, GuardrailMetrics & { p50?: number; p95?: number; p99?: number }> {
    const result: Record<string, any> = {};
    
    for (const [key, metrics] of this.metrics.entries()) {
      const sortedLatency = [...metrics.latency].sort((a, b) => a - b);
      result[key] = {
        ...metrics,
        p50: this.percentile(sortedLatency, 50),
        p95: this.percentile(sortedLatency, 95),
        p99: this.percentile(sortedLatency, 99),
      };
    }
    
    return result;
  }

  private percentile(sorted: number[], p: number): number | undefined {
    if (sorted.length === 0) return undefined;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private hashQuery(query: string): string {
    // Simple hash for caching (can be improved with crypto if needed)
    let hash = 0;
    const normalized = query.toLowerCase().trim();
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear metrics (for testing or reset)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Singleton instance
export const guardrailRegistry = new GuardrailRegistry();

