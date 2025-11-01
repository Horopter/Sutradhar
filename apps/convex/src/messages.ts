import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const append = mutation({
  args: {
    sessionId: v.string(),
    from: v.string(),
    text: v.string(),
    sourceRefs: v.optional(v.array(v.any())),
    latencyMs: v.optional(v.number()),
  },
  handler: async ({ db }, { sessionId, from, text, sourceRefs = [], latencyMs = 0 }) => {
    const msg = await db.insert("messages", {
      sessionId,
      from,
      text,
      sourceRefs,
      latencyMs,
      ts: Date.now()
    });
    return msg;
  },
});

export const bySession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async ({ db }, { sessionId }) => {
    // Use filter if index not ready yet, fallback to index when available
    try {
      return await db
        .query("messages")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .order("asc")
        .collect();
    } catch (e) {
      // Fallback: filter if index not ready
      return await db
        .query("messages")
        .filter((q) => q.eq(q.field("sessionId"), sessionId))
        .order("asc")
        .collect();
    }
  },
});

