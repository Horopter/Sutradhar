import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      userId: args.userId,
      type: args.type,
      payload: args.payload || {},
      ts: Date.now()
    });
  }
});

export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 100);
    return events;
  }
});

export const getByType = query({
  args: {
    userId: v.string(),
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(args.limit || 100);
    return events.filter(e => e.userId === args.userId);
  }
});

