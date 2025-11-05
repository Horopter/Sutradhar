import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    source: v.string(),
    description: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("points", {
      userId: args.userId,
      amount: args.amount,
      source: args.source,
      description: args.description,
      createdAt: args.createdAt
    });
  }
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("points")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  }
});

