import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.string(),
    badgeId: v.string(),
    badgeName: v.string(),
    badgeType: v.string(),
    badgeIcon: v.string(),
    rarity: v.string(),
    earnedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("achievements", {
      userId: args.userId,
      badgeId: args.badgeId,
      badgeName: args.badgeName,
      badgeType: args.badgeType,
      badgeIcon: args.badgeIcon,
      rarity: args.rarity,
      earnedAt: args.earnedAt
    });
  }
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  }
});

export const getByBadge = query({
  args: {
    userId: v.string(),
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("badgeId"), args.badgeId))
      .first();
  }
});

