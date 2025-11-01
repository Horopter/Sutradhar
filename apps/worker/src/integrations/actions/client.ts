/**
 * Action Client
 * Safe wrapper for action execution with mocking support
 */

import { env } from "../../env";
import { log } from "../../log";

export interface SafeActionResult<T> {
  ok: boolean;
  mocked: boolean;
  type: string;
  payload: any;
  result: T;
}

/**
 * Safely execute an action with mocking support
 */
export async function safeAction<T>(type: string, payload: any, fn: () => Promise<T>): Promise<SafeActionResult<T>> {
  // Read at runtime for hot-reload support
  const MOCK = String(process.env.MOCK_ACTIONS || env.MOCK_ACTIONS || "false").toLowerCase() === "true";
  if (MOCK) {
    return { 
      ok: true, 
      mocked: true, 
      type, 
      payload, 
      result: { note: "MOCK_ACTIONS enabled" } as T
    };
  }
  
  try {
    const result = await fn();
    return { ok: true, mocked: false, type, payload, result };
  } catch (error: any) {
    // If it's a connection error, provide helpful hints
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('Could not find a connection') || errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      throw new Error(`${errorMsg}. Hint: Ensure connections are set up and API keys are valid.`);
    }
    throw error;
  }
}
