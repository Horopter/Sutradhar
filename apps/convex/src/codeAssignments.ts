import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    courseSlug: v.string(),
    assignmentId: v.string(),
    title: v.string(),
    prompt: v.string(),
    starterCode: v.string(),
    language: v.string(),
    tests: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("codeAssignments")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        prompt: args.prompt,
        starterCode: args.starterCode,
        language: args.language,
        tests: args.tests
      });
      return existing._id;
    }
    
    return await ctx.db.insert("codeAssignments", {
      courseSlug: args.courseSlug,
      assignmentId: args.assignmentId,
      title: args.title,
      prompt: args.prompt,
      starterCode: args.starterCode,
      language: args.language,
      tests: args.tests
    });
  }
});

export const get = query({
  args: { assignmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeAssignments")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .first();
  }
});

export const listByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeAssignments")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("codeAssignments")
      .collect();
  }
});

