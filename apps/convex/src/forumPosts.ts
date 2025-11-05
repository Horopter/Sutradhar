import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    lessonId: v.string(),
    courseSlug: v.string(),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    upvotes: v.number(),
    answerCount: v.number(),
    isAnswered: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("forumPosts", args);
  }
});

export const get = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  }
});

export const getByIds = query({
  args: { postIds: v.array(v.id("forumPosts")) },
  handler: async (ctx, args) => {
    return await Promise.all(args.postIds.map(id => ctx.db.get(id)));
  }
});

export const getByLesson = query({
  args: {
    lessonId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("forumPosts")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .order("desc")
      .take(limit);
  }
});

export const incrementAnswerCount = mutation({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        answerCount: (post.answerCount || 0) + 1
      });
    }
  }
});

export const markAnswered = mutation({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      isAnswered: true
    });
  }
});

export const upvote = mutation({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        upvotes: (post.upvotes || 0) + 1
      });
    }
  }
});

export const search = query({
  args: {
    query: v.string(),
    courseSlug: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    let q = ctx.db.query("forumPosts");
    
    if (args.courseSlug) {
      q = q.withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug));
    }
    
    const results = await q
      .filter((post) => {
        const matchesQuery = args.query 
          ? post.title.toLowerCase().includes(args.query.toLowerCase()) ||
            post.content.toLowerCase().includes(args.query.toLowerCase())
          : true;
        const matchesTags = args.tags && args.tags.length > 0
          ? args.tags.some(tag => post.tags.includes(tag))
          : true;
        return matchesQuery && matchesTags;
      })
      .order("desc")
      .take(limit);
    
    return results;
  }
});

