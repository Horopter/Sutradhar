import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: {
    channel: v.string(),
    persona: v.string(),
    userName: v.string(),
  },
  handler: async ({ db }, { channel, persona, userName }) => {
    const now = Date.now();
    const doc = await db.insert("sessions", { 
      channel, 
      persona, 
      userName, 
      startedAt: now, 
      endedAt: 0 
    });
    return doc;
  },
});

export const end = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async ({ db }, { sessionId }) => {
    const s = await db.get(sessionId);
    if (!s) return null;
    await db.patch(sessionId, { endedAt: Date.now() });
    return { ok: true };
  },
});

export const list = query({
  handler: async ({ db }) => {
    const sessions = await db.query("sessions").order("desc").collect();
    return sessions;
  },
});

