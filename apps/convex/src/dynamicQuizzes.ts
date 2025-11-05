import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    quizId: v.string(),
    courseSlug: v.string(),
    lessonId: v.string(),
    questions: v.any(),
    difficulty: v.string(),
    generatedAt: v.number(),
    generatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dynamicQuizzes", args);
  }
});

export const get = query({
  args: { quizId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dynamicQuizzes")
      .filter((q) => q.eq(q.field("quizId"), args.quizId))
      .first();
  }
});

export const getByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dynamicQuizzes")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

export const getByLesson = query({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dynamicQuizzes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
  }
});

