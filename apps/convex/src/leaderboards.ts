import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {
    type: v.string(),
    courseSlug: v.optional(v.string()),
    period: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let query = ctx.db.query("leaderboards");
    
    if (args.courseSlug) {
      query = query.withIndex("by_course", (q) => 
        q.eq("courseSlug", args.courseSlug).eq("period", args.period)
      );
    } else {
      query = query.withIndex("by_type", (q) => 
        q.eq("type", args.type).eq("period", args.period)
      );
    }
    
    return await query
      .order("desc")
      .take(limit);
  }
});

export const getAll = query({
  args: {
    type: v.string(),
    courseSlug: v.optional(v.string()),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("leaderboards");
    
    if (args.courseSlug) {
      query = query.withIndex("by_course", (q) => 
        q.eq("courseSlug", args.courseSlug).eq("period", args.period)
      );
    } else {
      query = query.withIndex("by_type", (q) => 
        q.eq("type", args.type).eq("period", args.period)
      );
    }
    
    return await query.collect();
  }
});

export const upsert = mutation({
  args: {
    type: v.string(),
    courseSlug: v.optional(v.string()),
    userId: v.string(),
    score: v.number(),
    period: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leaderboards")
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), args.type),
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("period"), args.period),
          args.courseSlug ? q.eq(q.field("courseSlug"), args.courseSlug) : q.eq(q.field("courseSlug"), undefined)
        )
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        updatedAt: args.updatedAt
      });
      return existing._id;
    }
    
    return await ctx.db.insert("leaderboards", {
      type: args.type,
      courseSlug: args.courseSlug || "",
      userId: args.userId,
      score: args.score,
      rank: 0,
      period: args.period,
      updatedAt: args.updatedAt
    });
  }
});

export const updateRank = mutation({
  args: {
    type: v.string(),
    courseSlug: v.optional(v.string()),
    userId: v.string(),
    rank: v.number(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leaderboards")
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), args.type),
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("period"), args.period),
          args.courseSlug ? q.eq(q.field("courseSlug"), args.courseSlug) : q.eq(q.field("courseSlug"), undefined)
        )
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        rank: args.rank
      });
    }
  }
});

