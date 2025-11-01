/**
 * HTTP Client Utility
 * Wraps fetch with connection pooling, retries, and error handling
 */

import fetch, { RequestInit, Response } from 'node-fetch';
import { getAgent } from '../core/http/client-pool';
import { log } from '../log';

export interface HttpClientOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Enhanced fetch with connection pooling, timeouts, and retries
 */
export async function httpFetch(
  url: string,
  options: HttpClientOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  // Use connection pooling agent
  const agent = getAgent(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          agent,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on abort (timeout) or client errors (4xx)
        if (error.name === 'AbortError' || (error.response?.status >= 400 && error.response?.status < 500)) {
          throw error;
        }

        // Retry with exponential backoff
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          log.warn(`Request failed, retrying in ${delay}ms`, {
            url,
            attempt: attempt + 1,
            error: error.message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Request failed after retries');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * JSON fetch helper
 */
export async function httpFetchJson<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const response = await httpFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

