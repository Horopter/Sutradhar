import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    courseSlug: v.string(),
    lessonId: v.string(),
    title: v.string(),
    body: v.string(),
    assets: v.optional(v.array(v.string())),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_course_lesson", (q) => 
        q.eq("courseSlug", args.courseSlug).eq("lessonId", args.lessonId)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        body: args.body,
        assets: args.assets || [],
        difficulty: args.difficulty || "beginner"
      });
      return existing._id;
    }
    
    return await ctx.db.insert("lessons", {
      courseSlug: args.courseSlug,
      lessonId: args.lessonId,
      title: args.title,
      body: args.body,
      assets: args.assets || [],
      difficulty: args.difficulty || "beginner"
    });
  }
});

export const listByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

export const get = query({
  args: {
    courseSlug: v.string(),
    lessonId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course_lesson", (q) => 
        q.eq("courseSlug", args.courseSlug).eq("lessonId", args.lessonId)
      )
      .first();
  }
});

