import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGuest = mutation({
  args: {},
  handler: async (ctx) => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      email: `guest_${guestId}@masterbolt.local`,
      name: `Guest ${guestId.substring(6, 12)}`,
      role: "guest",
      createdAt: now,
      lastLoginAt: now,
      streak: 0,
      badges: []
    });
    
    return { userId, user: await ctx.db.get(userId) };
  }
});

export const createOrGet = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastLoginAt: Date.now()
      });
      return { userId: existing._id, user: existing };
    }
    
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name || args.email.split("@")[0],
      role: "user",
      createdAt: now,
      lastLoginAt: now,
      streak: 0,
      badges: []
    });
    
    return { userId, user: await ctx.db.get(userId) };
  }
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  }
});

export const updateStreak = mutation({
  args: {
    userId: v.id("users"),
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.userId, {
      streak: (user.streak || 0) + (args.increment || 1)
    });
  }
});

export const addBadge = mutation({
  args: {
    userId: v.id("users"),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const badges = new Set(user.badges || []);
    badges.add(args.badge);
    
    await ctx.db.patch(args.userId, {
      badges: Array.from(badges)
    });
  }
});

