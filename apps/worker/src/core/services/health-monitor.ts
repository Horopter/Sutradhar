/**
 * Health Monitor Service - Tracks health and performance of all endpoints
 */

import { log } from '../../log';
import { cache } from '../cache';

export interface EndpointHealth {
  path: string;
  method: string;
  healthy: boolean;
  lastChecked: number;
  lastSuccess?: number;
  lastFailure?: number;
  responseTime?: number;
  errorCount: number;
  successCount: number;
  totalRequests: number;
  averageResponseTime: number;
  uptime: number; // Percentage
  errorRate: number; // Percentage
  statusCode?: number;
  error?: string;
  lastError?: string;
}

export interface HeartbeatStatus {
  serviceName: string;
  timestamp: number;
  uptime: number;
  version?: string;
  environment?: string;
  endpoints: EndpointHealth[];
  overallHealth: boolean;
}

class HealthMonitorService {
  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly serviceStartTime = Date.now();
  private readonly cacheKey = 'health:heartbeat';

  /**
   * Record an endpoint request
   */
  recordRequest(
    path: string,
    method: string,
    responseTime: number,
    success: boolean,
    statusCode?: number,
    error?: string
  ): void {
    const key = `${method}:${path}`;
    const now = Date.now();

    let health = this.endpointHealth.get(key);
    if (!health) {
      health = {
        path,
        method,
        healthy: true,
        lastChecked: now,
        errorCount: 0,
        successCount: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        uptime: 100,
        errorRate: 0,
      };
      this.endpointHealth.set(key, health);
    }

    health.lastChecked = now;
    health.totalRequests++;
    health.responseTime = responseTime;

    if (success) {
      health.lastSuccess = now;
      health.successCount++;
      health.healthy = health.errorRate < 50; // Consider unhealthy if >50% errors
      health.statusCode = statusCode;
      health.error = undefined;
    } else {
      health.lastFailure = now;
      health.errorCount++;
      health.lastError = error;
      health.statusCode = statusCode;
      health.error = error;
      // Mark unhealthy if recent errors
      if (health.errorRate > 50) {
        health.healthy = false;
      }
    }

    // Calculate metrics
    const total = health.totalRequests;
    health.uptime = total > 0 ? (health.successCount / total) * 100 : 100;
    health.errorRate = total > 0 ? (health.errorCount / total) * 100 : 0;

    // Update average response time (exponential moving average)
    if (health.averageResponseTime === 0) {
      health.averageResponseTime = responseTime;
    } else {
      health.averageResponseTime = health.averageResponseTime * 0.9 + responseTime * 0.1;
    }

    // Update cache for heartbeat
    this.updateHeartbeat();
  }

  /**
   * Get health status for an endpoint
   */
  getEndpointHealth(path: string, method: string): EndpointHealth | undefined {
    const key = `${method}:${path}`;
    return this.endpointHealth.get(key);
  }

  /**
   * Get all endpoint health statuses
   */
  getAllHealth(): EndpointHealth[] {
    return Array.from(this.endpointHealth.values()).sort((a, b) => 
      a.path.localeCompare(b.path)
    );
  }

  /**
   * Get overall health status
   */
  getHeartbeatStatus(): HeartbeatStatus {
    const endpoints = this.getAllHealth();
    const now = Date.now();
    const uptime = now - this.serviceStartTime;

    // Overall health: healthy if >80% of endpoints are healthy
    const healthyEndpoints = endpoints.filter(e => e.healthy).length;
    const overallHealth = endpoints.length === 0 || (healthyEndpoints / endpoints.length) >= 0.8;

    return {
      serviceName: 'sutradhar-worker',
      timestamp: now,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints,
      overallHealth,
    };
  }

  /**
   * Update heartbeat in cache (for distributed systems)
   */
  private async updateHeartbeat(): Promise<void> {
    try {
      const status = this.getHeartbeatStatus();
      await cache.set(this.cacheKey, status, 120); // 2 minutes TTL
    } catch (error) {
      log.warn('Failed to update heartbeat in cache', error);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat(intervalMs: number = 30000): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Initial heartbeat
    this.updateHeartbeat();

    // Periodic heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat();
      log.debug('Heartbeat sent', { 
        timestamp: Date.now(),
        endpoints: this.endpointHealth.size,
      });
    }, intervalMs);

    log.info('Health monitor heartbeat started', { intervalMs });
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      log.info('Health monitor heartbeat stopped');
    }
  }

  /**
   * Check if an endpoint is healthy
   */
  isEndpointHealthy(path: string, method: string): boolean {
    const health = this.getEndpointHealth(path, method);
    if (!health) return true; // Unknown endpoints considered healthy by default
    
    // Check if endpoint hasn't been checked recently (might be inactive)
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - health.lastChecked > staleThreshold) {
      return true; // Stale endpoints considered healthy
    }

    return health.healthy;
  }

  /**
   * Get health summary for dashboard
   */
  getHealthSummary(): {
    total: number;
    healthy: number;
    unhealthy: number;
    totalRequests: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const endpoints = this.getAllHealth();
    const healthy = endpoints.filter(e => e.healthy).length;
    const totalRequests = endpoints.reduce((sum, e) => sum + e.totalRequests, 0);
    const avgResponseTime = endpoints.length > 0
      ? endpoints.reduce((sum, e) => sum + e.averageResponseTime, 0) / endpoints.length
      : 0;
    const overallUptime = endpoints.length > 0
      ? endpoints.reduce((sum, e) => sum + e.uptime, 0) / endpoints.length
      : 100;

    return {
      total: endpoints.length,
      healthy,
      unhealthy: endpoints.length - healthy,
      totalRequests,
      averageResponseTime: avgResponseTime,
      uptime: overallUptime,
    };
  }

  /**
   * Clear old/stale health data (keep last 1000 endpoints)
   */
  cleanup(): void {
    if (this.endpointHealth.size > 1000) {
      const entries = Array.from(this.endpointHealth.entries())
        .sort((a, b) => b[1].lastChecked - a[1].lastChecked);
      
      const toKeep = entries.slice(0, 1000);
      this.endpointHealth = new Map(toKeep);
      log.info('Health monitor: Cleaned up old endpoint health data');
    }
  }
}

export const healthMonitor = new HealthMonitorService();

