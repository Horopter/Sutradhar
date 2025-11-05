import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    contentType: v.string(),
    courseSlug: v.string(),
    lessonId: v.optional(v.string()),
    content: v.any(),
    generatedBy: v.string(),
    createdAt: v.number(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedContent", args);
  }
});

export const getByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedContent")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

export const getByLesson = query({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generatedContent")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
  }
});

