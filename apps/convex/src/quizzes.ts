import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    courseSlug: v.string(),
    quizId: v.string(),
    title: v.string(),
    questions: v.any(),
    passScore: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("quizzes")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        questions: args.questions,
        passScore: args.passScore
      });
      return existing._id;
    }
    
    return await ctx.db.insert("quizzes", {
      courseSlug: args.courseSlug,
      quizId: args.quizId,
      title: args.title,
      questions: args.questions,
      passScore: args.passScore
    });
  }
});

export const get = query({
  args: { quizId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .first();
  }
});

export const listByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

export const recordAttempt = mutation({
  args: {
    userId: v.string(),
    quizId: v.string(),
    score: v.number(),
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

export const getAttempts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  }
});

