/**
 * Backoff utility for retries and delays
 */

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface RetryOptions {
  retries?: number;
  delay?: number;
  maxDelay?: number;
  exponential?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 250,
    maxDelay = 10000,
    exponential = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const waitTime = exponential
          ? Math.min(delay * Math.pow(2, attempt), maxDelay)
          : delay;

        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        await sleep(waitTime);
      }
    }
  }

  throw lastError!;
}

