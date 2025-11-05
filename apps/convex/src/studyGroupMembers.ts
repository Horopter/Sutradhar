import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    groupId: v.string(),
    userId: v.string(),
    role: v.string(),
    joinedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studyGroupMembers", args);
  }
});

export const get = query({
  args: {
    groupId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyGroupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  }
});

