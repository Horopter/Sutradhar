/**
 * Convex Client - For Sutradhar to access Convex database
 */

import fetch from "node-fetch";
import { env } from "./env";
import { getAgent } from "./core/http/client-pool";

const BASE = env.CONVEX_URL;

// Throw clear error at startup if CONVEX_URL is missing
if (!BASE) {
  console.error("❌ ERROR: CONVEX_URL not set. Convex operations will be skipped.");
  console.error("   Set CONVEX_URL in .env (e.g., http://127.0.0.1:3210) and ensure Convex dev server is running.");
}

// Use connection pooling for Convex requests
const getFetchOptions = () => ({
  agent: getAgent(BASE || 'http://localhost'),
  headers: { "Content-Type": "application/json" },
});

async function convexQuery(path: string, args: any = {}) {
  if (!BASE) return { ok: false, skipped: true };

  const res = await fetch(`${BASE}/api/query`, {
    method: "POST",
    ...getFetchOptions(),
    body: JSON.stringify({ path, args, format: "json" })
  });

  if (!res.ok) throw new Error(`Convex query ${path} ${res.status}`);
  return res.json();
}

async function convexMutation(path: string, args: any = {}) {
  if (!BASE) return { ok: false, skipped: true };

  const res = await fetch(`${BASE}/api/mutation`, {
    method: "POST",
    ...getFetchOptions(),
    body: JSON.stringify({ path, args, format: "json" })
  });

  if (!res.ok) throw new Error(`Convex mutation ${path} ${res.status}`);
  return res.json();
}

/**
 * Batch multiple queries in parallel
 */
export async function convexBatchQueries(queries: Array<{ path: string; args?: any }>): Promise<any[]> {
  if (!BASE) return queries.map(() => ({ ok: false, skipped: true }));
  
  // Execute all queries in parallel
  return Promise.all(
    queries.map(({ path, args }) => convexQuery(path, args))
  );
}

export const Convex = {
  queries: convexQuery,
  mutations: convexMutation,
  batchQueries: convexBatchQueries,
  
  sessions: {
    start: (args: { channel: string; persona: string; userName: string }) => 
      convexMutation("sessions:start", args),
    end:   (args: { sessionId: string }) => 
      convexMutation("sessions:end", args),
    list:  () => 
      convexQuery("sessions:list", {})
  },

  messages: {
    append: (args: { sessionId: string; from: string; text: string; sourceRefs?: any[]; latencyMs?: number }) => 
      convexMutation("messages:append", args),
    bySession: (args: { sessionId: string }) => 
      convexQuery("messages:bySession", args)
  },

  actions: {
    log: (args: { sessionId: string; type: string; status: string; payload?: any; result?: any }) => 
      convexMutation("actions:log", args),
    listBySession: (args: { sessionId: string }) => 
      convexQuery("actions_list:listBySession", args)
  },

  escalations: {
    upsert: (args: { sessionId: string; reason: string; severity: string; agentmailThreadId: string; status?: string }) => 
      convexMutation("escalations:upsert", args)
  },

  logs: {
    append: (args: {
      sessionId: string;
      requestId?: string;
      level: string;
      message: string;
      timestamp: number;
      metadata?: any;
      service?: string;
      path?: string;
      method?: string;
      statusCode?: number;
      durationMs?: number;
      error?: any;
    }) => convexMutation("logs:append", args),
    bySession: (args: {
      sessionId: string;
      limit?: number;
      level?: string;
      startTime?: number;
      endTime?: number;
    }) => convexQuery("logs:bySession", args),
    recentSessions: (args: { limit?: number; userId?: string }) => 
      convexQuery("logs:recentSessions", args),
    search: (args: {
      query: string;
      level?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }) => convexQuery("logs:search", args),
    sessionStats: (args: { sessionId: string }) => 
      convexQuery("logs:sessionStats", args),
  }
};

