import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    itemId: v.string(),
    reason: v.string(),
    score: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      userId: args.userId,
      type: args.type,
      itemId: args.itemId,
      reason: args.reason,
      score: args.score,
      createdAt: args.createdAt,
      viewedAt: 0
    });
  }
});

export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  }
});

