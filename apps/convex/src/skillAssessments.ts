import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    userId: v.string(),
    skillName: v.string(),
    level: v.number(),
    confidence: v.number(),
    improvementRate: v.number(),
    lastAssessedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("skillAssessments")
      .withIndex("by_user_skill", (q) => 
        q.eq("userId", args.userId).eq("skillName", args.skillName)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        level: args.level,
        confidence: args.confidence,
        improvementRate: args.improvementRate,
        lastAssessedAt: args.lastAssessedAt
      });
      return existing._id;
    }
    
    return await ctx.db.insert("skillAssessments", args);
  }
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skillAssessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  }
});

