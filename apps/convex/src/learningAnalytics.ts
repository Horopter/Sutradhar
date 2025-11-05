import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRange = query({
  args: {
    userId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningAnalytics")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
  }
});

export const getRecent = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return await ctx.db
      .query("learningAnalytics")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("date"), startDate))
      .order("desc")
      .collect();
  }
});

export const getByDate = query({
  args: {
    userId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningAnalytics")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();
  }
});

export const create = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    timeSpent: v.number(),
    lessonsCompleted: v.number(),
    quizzesPassed: v.number(),
    codeSubmissions: v.number(),
    averageScore: v.number(),
    engagementScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("learningAnalytics", args);
  }
});

export const update = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    timeSpent: v.number(),
    lessonsCompleted: v.number(),
    quizzesPassed: v.number(),
    codeSubmissions: v.number(),
    engagementScore: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("learningAnalytics")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        timeSpent: args.timeSpent,
        lessonsCompleted: args.lessonsCompleted,
        quizzesPassed: args.quizzesPassed,
        codeSubmissions: args.codeSubmissions,
        engagementScore: args.engagementScore
      });
    }
  }
});

