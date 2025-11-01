import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    assignmentId: v.string(),
    code: v.string(),
    results: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("codeSubmissions", {
      userId: args.userId,
      assignmentId: args.assignmentId,
      code: args.code,
      results: args.results,
      createdAt: Date.now()
    });
  }
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  }
});

export const getByAssignment = query({
  args: { assignmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeSubmissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();
  }
});

