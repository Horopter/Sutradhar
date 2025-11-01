import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    courseSlug: v.string(),
    url: v.string(),
    source: v.string(),
    caption: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if image already exists
    const existing = await ctx.db
      .query("images")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("images", {
      courseSlug: args.courseSlug,
      url: args.url,
      source: args.source,
      caption: args.caption
    });
  }
});

export const listByCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("images")
      .withIndex("by_course", (q) => q.eq("courseSlug", args.courseSlug))
      .collect();
  }
});

