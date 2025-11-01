import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    sessionId: v.string(),
    type: v.string(),
    status: v.string(),
    payload: v.optional(v.any()),
    result: v.optional(v.any()),
  },
  handler: async ({ db }, { sessionId, type, status, payload = {}, result = {} }) => {
    return await db.insert("actions", { 
      sessionId, 
      type, 
      status, 
      payload, 
      result, 
      ts: Date.now() 
    });
  },
});

