/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping calls to failing services
 */

import { log } from '../log';

export interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening
  successThreshold: number;  // Number of successes before closing
  timeout: number;           // Time in ms before attempting to close
  resetTimeout: number;      // Time in ms before attempting half-open
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(
    private readonly name: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 1 minute
      resetTimeout: config?.resetTimeout ?? 30000, // 30 seconds
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition
    this.updateState();

    if (this.state === 'open') {
      throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private updateState(): void {
    const now = Date.now();

    if (this.state === 'open') {
      // Check if we should try half-open
      if (now - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
        log.info(`Circuit breaker ${this.name} transitioning to HALF-OPEN`);
      }
    } else if (this.state === 'half-open') {
      // Already in half-open, will transition based on success/failure
    } else {
      // Closed state - check if failures should open it
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = 'open';
        this.lastFailureTime = now;
        log.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
      }
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        log.info(`Circuit breaker ${this.name} closed after ${this.successCount} successes`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Immediately open on failure in half-open
      this.state = 'open';
      log.warn(`Circuit breaker ${this.name} reopened after failure in half-open state`);
    }
  }

  getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    log.info(`Circuit breaker ${this.name} manually reset`);
  }
}

// Registry for managing multiple circuit breakers
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

