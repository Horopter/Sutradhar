import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    startedAt: v.number(),
    endedAt: v.number(),
    duration: v.number(),
    activityType: v.string(),
    itemsCompleted: v.array(v.string()),
    engagementScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("learningSessions", args);
  }
});

export const getRecent = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    
    return await ctx.db
      .query("learningSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("startedAt"), cutoff))
      .order("desc")
      .collect();
  }
});

export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("learningSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  }
});

