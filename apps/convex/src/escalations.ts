import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    sessionId: v.string(),
    reason: v.string(),
    severity: v.string(),
    agentmailThreadId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async ({ db }, { sessionId, reason, severity, agentmailThreadId, status = "open" }) => {
    const now = Date.now();
    const rec = await db.insert("escalations", {
      sessionId, 
      reason, 
      severity, 
      agentmailThreadId, 
      status, 
      lastEmailAt: now, 
      createdAt: now
    });
    return rec;
  },
});

