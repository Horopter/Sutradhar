import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    coverImg: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        coverImg: args.coverImg || existing.coverImg
      });
      return existing._id;
    }
    
    return await ctx.db.insert("courses", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      coverImg: args.coverImg || ""
    });
  }
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  }
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  }
});

