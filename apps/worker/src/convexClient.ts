import fetch from "node-fetch";
import { env } from "./env";

const BASE = env.CONVEX_URL;

// Throw clear error at startup if CONVEX_URL is missing
if (!BASE) {
  console.error("❌ ERROR: CONVEX_URL not set. Convex operations will be skipped.");
  console.error("   Set CONVEX_URL in .env (e.g., http://127.0.0.1:3210) and ensure Convex dev server is running.");
}

async function convexQuery(path: string, args: any = {}) {
  if (!BASE) return { ok: false, skipped: true };

  const res = await fetch(`${BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" })
  });

  if (!res.ok) throw new Error(`Convex query ${path} ${res.status}`);
  return res.json();
}

async function convexMutation(path: string, args: any = {}) {
  if (!BASE) return { ok: false, skipped: true };

  const res = await fetch(`${BASE}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" })
  });

  if (!res.ok) throw new Error(`Convex mutation ${path} ${res.status}`);
  return res.json();
}

export const Convex = {
  queries: convexQuery,
  mutations: convexMutation,
  
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
