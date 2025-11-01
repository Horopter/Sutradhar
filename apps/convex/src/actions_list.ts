import { query } from "./_generated/server";
import { v } from "convex/values";

export const listBySession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async ({ db }, { sessionId }) => {
    const all = await db.query("actions").collect();
    return all
      .filter(a => a.sessionId === sessionId)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  },
});

