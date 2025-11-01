import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    startISO: v.string(),
    endISO: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("schedules", {
      userId: args.userId,
      title: args.title,
      startISO: args.startISO,
      endISO: args.endISO,
      provider: args.provider
    });
  }
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  }
});

