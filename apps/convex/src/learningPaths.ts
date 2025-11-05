import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    userId: v.string(),
    courseSlug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningPaths")
      .withIndex("by_user_course", (q) => 
        q.eq("userId", args.userId).eq("courseSlug", args.courseSlug)
      )
      .first();
  }
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    courseSlug: v.string(),
    pathData: v.any(),
    currentLesson: v.string(),
    startedAt: v.number(),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("learningPaths")
      .withIndex("by_user_course", (q) => 
        q.eq("userId", args.userId).eq("courseSlug", args.courseSlug)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        pathData: args.pathData,
        currentLesson: args.currentLesson,
        difficulty: args.difficulty || existing.difficulty,
      });
      return existing._id;
    }
    
    return await ctx.db.insert("learningPaths", {
      userId: args.userId,
      courseSlug: args.courseSlug,
      pathData: args.pathData,
      currentLesson: args.currentLesson,
      startedAt: args.startedAt,
      completedAt: 0,
      difficulty: args.difficulty || "intermediate"
    });
  }
});

export const updateDifficulty = mutation({
  args: {
    userId: v.string(),
    courseSlug: v.string(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("learningPaths")
      .withIndex("by_user_course", (q) => 
        q.eq("userId", args.userId).eq("courseSlug", args.courseSlug)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        difficulty: args.difficulty
      });
    }
  }
});

