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

export const get = query({
  args: { submissionId: v.id("codeSubmissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.submissionId);
  }
});

export const getByUserCourse = query({
  args: {
    userId: v.string(),
    courseSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("codeSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by course by checking assignment's courseSlug
    const assignments = await ctx.db
      .query("codeAssignments")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
    
    const assignmentIds = new Set(assignments.map(a => a.assignmentId));
    return submissions.filter(s => assignmentIds.has(s.assignmentId));
  }
});

