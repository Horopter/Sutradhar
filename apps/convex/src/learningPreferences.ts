import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  }
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    learningStyle: v.optional(v.string()),
    preferredFormat: v.optional(v.any()),
    pace: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("learningPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        learningStyle: args.learningStyle || existing.learningStyle,
        preferredFormat: args.preferredFormat || existing.preferredFormat,
        pace: args.pace || existing.pace,
        difficulty: args.difficulty || existing.difficulty,
        updatedAt: args.updatedAt
      });
      return existing._id;
    }
    
    return await ctx.db.insert("learningPreferences", {
      userId: args.userId,
      learningStyle: args.learningStyle || "reading",
      preferredFormat: args.preferredFormat || ["text"],
      pace: args.pace || "normal",
      difficulty: args.difficulty || "intermediate",
      updatedAt: args.updatedAt
    });
  }
});

