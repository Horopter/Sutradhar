import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    courseSlug: v.string(),
    description: v.string(),
    createdBy: v.string(),
    memberIds: v.array(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studyGroups", args);
  }
});

export const get = query({
  args: { groupId: v.id("studyGroups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  }
});

export const getByCourse = query({
  args: {
    courseSlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("studyGroups")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);
  }
});

export const addMember = mutation({
  args: {
    groupId: v.id("studyGroups"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    
    const memberIds = new Set(group.memberIds || []);
    memberIds.add(args.userId);
    
    await ctx.db.patch(args.groupId, {
      memberIds: Array.from(memberIds)
    });
  }
});

