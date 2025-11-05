import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    postId: v.string(),
    userId: v.string(),
    content: v.string(),
    upvotes: v.number(),
    isAccepted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("forumReplies", args);
  }
});

export const get = query({
  args: { replyId: v.id("forumReplies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.replyId);
  }
});

export const getByPost = query({
  args: {
    postId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("forumReplies")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(limit);
  }
});

export const accept = mutation({
  args: { replyId: v.id("forumReplies") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.replyId, {
      isAccepted: true
    });
  }
});

export const upvote = mutation({
  args: { replyId: v.id("forumReplies") },
  handler: async (ctx, args) => {
    const reply = await ctx.db.get(args.replyId);
    if (reply) {
      await ctx.db.patch(args.replyId, {
        upvotes: (reply.upvotes || 0) + 1
      });
    }
  }
});

