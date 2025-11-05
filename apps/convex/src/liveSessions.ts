import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    roomId: v.string(),
    title: v.string(),
    hostId: v.string(),
    participantIds: v.array(v.string()),
    courseSlug: v.string(),
    scheduledAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("liveSessions", {
      roomId: args.roomId,
      title: args.title,
      hostId: args.hostId,
      participantIds: args.participantIds,
      courseSlug: args.courseSlug,
      scheduledAt: args.scheduledAt,
      startedAt: args.startedAt || 0,
      endedAt: args.endedAt || 0,
      type: args.type
    });
  }
});

export const getByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liveSessions")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .order("desc")
      .collect();
  }
});

