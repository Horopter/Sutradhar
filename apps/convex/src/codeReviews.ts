import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    submissionId: v.string(),
    reviewerId: v.string(),
    feedback: v.any(),
    score: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("codeReviews", args);
  }
});

export const getBySubmission = query({
  args: { submissionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("codeReviews")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .order("desc")
      .collect();
  }
});

