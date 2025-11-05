import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    quizId: v.string(),
    score: v.number(),
    passed: v.optional(v.boolean()),
    correct: v.optional(v.number()),
    total: v.optional(v.number()),
    answers: v.any(),
    startedAt: v.number(),
    finishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quizAttempts", {
      userId: args.userId,
      quizId: args.quizId,
      score: args.score,
      answers: args.answers,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt
    });
  }
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  }
});

export const getByUserCourse = query({
  args: {
    userId: v.string(),
    courseSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by course by checking quiz's courseSlug
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
    
    const quizIds = new Set(quizzes.map(q => q.quizId));
    return attempts.filter(a => quizIds.has(a.quizId));
  }
});

