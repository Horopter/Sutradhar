/**
 * HTTP Client Pool
 * Manages HTTP connections with connection pooling and keep-alive
 */

import http from 'http';
import https from 'https';
import { log } from '../../log';

// Configure agents with keep-alive for connection reuse
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

/**
 * Get appropriate agent for URL
 */
export function getAgent(url: string): http.Agent | https.Agent {
  return url.startsWith('https') ? httpsAgent : httpAgent;
}

/**
 * Destroy all agents (for graceful shutdown)
 */
export function destroyAgents(): void {
  httpAgent.destroy();
  httpsAgent.destroy();
  log.info('HTTP agents destroyed');
}

