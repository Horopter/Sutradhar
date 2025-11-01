import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Append a log entry
 */
export const append = mutation({
  args: {
    sessionId: v.string(),
    requestId: v.optional(v.string()),
    level: v.string(),
    message: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
    service: v.optional(v.string()),
    path: v.optional(v.string()),
    method: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    error: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("logs", {
      sessionId: args.sessionId,
      requestId: args.requestId || "",
      level: args.level,
      message: args.message,
      timestamp: args.timestamp,
      metadata: args.metadata || {},
      service: args.service || "",
      path: args.path || "",
      method: args.method || "",
      statusCode: args.statusCode,
      durationMs: args.durationMs,
      error: args.error,
    });
  },
});

/**
 * Get logs by session ID (most recent first)
 */
export const bySession = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
    level: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("logs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc");

    // Filter by level if provided
    if (args.level) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }

    // Filter by time range if provided
    if (args.startTime !== undefined) {
      query = query.filter((q) => q.gte(q.field("timestamp"), args.startTime));
    }
    if (args.endTime !== undefined) {
      query = query.filter((q) => q.lte(q.field("timestamp"), args.endTime));
    }

    const logs = await query.take(args.limit || 1000);
    return logs;
  },
});

/**
 * Get recent sessions with logs
 */
export const recentSessions = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get distinct session IDs from recent logs (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const recentLogs = await ctx.db
      .query("logs")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", thirtyDaysAgo))
      .order("desc")
      .take(10000); // Get more to find distinct sessions

    // Group by session and get most recent log for each
    const sessionMap = new Map<string, any>();
    for (const log of recentLogs) {
      if (!sessionMap.has(log.sessionId)) {
        sessionMap.set(log.sessionId, {
          sessionId: log.sessionId,
          lastLogAt: log.timestamp,
          logCount: 0,
        });
      }
      const session = sessionMap.get(log.sessionId);
      session.logCount++;
      if (log.timestamp > session.lastLogAt) {
        session.lastLogAt = log.timestamp;
      }
    }

    // Convert to array and sort by most recent
    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => b.lastLogAt - a.lastLogAt)
      .slice(0, args.limit || 50);

    // Get session details from sessions table if session IDs match Convex IDs
    // Note: sessionId might be a string, not a Convex ID
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (s) => {
        try {
          const sessionDetails = await ctx.db
            .query("sessions")
            .filter((q) => q.eq(q.field("_id"), s.sessionId))
            .first();
          
          return {
            ...s,
            session: sessionDetails || null,
          };
        } catch {
          // If sessionId is not a Convex ID format, return without session details
          return {
            ...s,
            session: null,
          };
        }
      })
    );

    return sessionsWithDetails;
  },
});

/**
 * Search logs across all sessions
 */
export const search = query({
  args: {
    query: v.string(),
    level: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("logs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.startTime || 0)
      )
      .order("desc");

    // Filter by level if provided
    if (args.level) {
      q = q.filter((q) => q.eq(q.field("level"), args.level));
    }

    // Filter by end time if provided
    if (args.endTime !== undefined) {
      q = q.filter((q) => q.lte(q.field("timestamp"), args.endTime));
    }

    const logs = await q.take(args.limit || 100);
    
    // Simple text search in message and metadata
    const searchLower = args.query.toLowerCase();
    const filtered = logs.filter((log) => {
      const messageMatch = log.message.toLowerCase().includes(searchLower);
      const metadataMatch = JSON.stringify(log.metadata || {}).toLowerCase().includes(searchLower);
      return messageMatch || metadataMatch;
    });

    return filtered.slice(0, args.limit || 100);
  },
});

/**
 * Cleanup logs older than 30 days
 */
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const oldLogs = await ctx.db
      .query("logs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", thirtyDaysAgo))
      .collect();

    let deleted = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deleted++;
    }

    return { deleted, timestamp: Date.now() };
  },
});

/**
 * Get log statistics for a session
 */
export const sessionStats = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("logs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const stats = {
      total: logs.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        verbose: 0,
        debug: 0,
      },
      firstLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      lastLog: logs.length > 0 ? logs[0].timestamp : null,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      stats.byLevel[log.level as keyof typeof stats.byLevel]++;
      if (log.durationMs) {
        totalDuration += log.durationMs;
        durationCount++;
      }
    }

    if (durationCount > 0) {
      stats.avgDuration = Math.round(totalDuration / durationCount);
    }

    return stats;
  },
});

