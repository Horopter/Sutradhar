/**
 * Server - Using scalable plugin architecture
 */

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { z } from 'zod';
import { env } from './env';
// Legacy log import maintained for backward compatibility
import { log } from './log';
// Use new logger for new code
import { logger } from './core/logging/logger';
import { SendEmailSchema } from './agentmail/schemas';
import { webhookRouter } from './agentmail/webhook';
import { tokenRoute } from './voice/token';
import { processVoiceMessage } from './voice/agent';
import { agentmailSelfCheck } from './agentmail/adapter';
import { convexSelfTest } from './convexDiag';
import { runComposioDiag } from './diag';
import { hyperspellDiag } from './retrieval/clients';
import { setToggle } from './admin/toggles';
import { SYSTEM_ANSWER, SYSTEM_SUMMARIZE, SYSTEM_ESCALATE } from './llm/prompts';
// Rube/composio client removed - use integrations/actions/client.ts instead
import { checkGuardrails, guardrailRegistry } from './core/guardrails';
import { v1Routes } from './routes/v1';
import { unifiedApiRoutes } from './api/v1';
import { edtechRoutes } from './routes/edtech';
import { edtechRoutesV2 } from './routes/edtech-v2';
import { shutdownService } from './core/services/shutdown';
import { startLogCleanup } from './core/logging/cleanup';

// Production middleware
import {
  requestContext,
  errorHandler,
  asyncHandler,
  rateLimiters,
  validate,
  timeouts,
  deduplicateOperation,
} from './core/middleware';

// Metrics and monitoring
import * as prometheus from 'prom-client';
import * as Sentry from '@sentry/node';

// New architecture imports
import { initializePlugins, shutdownPlugins } from './core/plugin-factory';
import { pluginRegistry } from './core/plugin-registry';
import { emailService } from './core/services/email-service';
import { actionService } from './core/services/action-service';
import { llmService } from './core/services/llm-service';
import { retrievalService } from './core/services/retrieval-service';
import { answerService } from './core/services/answer-service';
import { sessionService } from './core/services/session-service';
import { healthMonitor } from './core/services/health-monitor';
import { trackHealth } from './core/middleware/health-tracker';
import { circuitBreakerRegistry } from './core/circuit-breaker';

const app = express();

// Export app for testing
export { app };

// Initialize Sentry if DSN is provided (must be before other middleware)
// Note: Sentry is optional and won't block server startup if not configured
if (env.SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    log.info('Sentry initialized', { environment: env.NODE_ENV });
  } catch (e) {
    log.warn('Sentry initialization failed, continuing without it', e);
  }
}

// Register default Prometheus metrics
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

// Create custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const llmRequestsTotal = new prometheus.Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['provider', 'status'],
  registers: [register],
});

export const actionRequestsTotal = new prometheus.Counter({
  name: 'action_requests_total',
  help: 'Total number of action requests',
  labelNames: ['action_type', 'status'],
  registers: [register],
});

// Production middleware stack (order matters!)
app.use(morgan('combined'));
app.use(compression()); // Compress responses to reduce bandwidth
app.use(requestContext); // Add request ID and timing
app.use(trackHealth); // Track health for all endpoints

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  
  next();
});

// CORS configuration for API service
// Allow all origins in development, specific origins in production
const corsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Session-ID', 'X-API-Key']
    }
  : {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Session-ID', 'X-API-Key']
    };

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use('/webhooks/agentmail', bodyParser.raw({ type: 'application/json' }));

// Webhook router
app.use('/', webhookRouter);

// ========== OAuth Authentication ==========

/**
 * Unified OAuth handler to reduce code duplication
 */
const handleOAuthLogin = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.path.split('/')[2]; // Extract provider from path
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const hasApiKey = !!(env.COMPOSIO_API_KEY || env.RUBE_API_KEY);

  if (hasApiKey) {
    // For now, return dummy login since OAuth setup requires dashboard configuration
    log.info(`OAuth requested for ${provider} but using dummy mode (OAuth requires dashboard setup)`);
    res.json({ 
      ok: true, 
      dummy: true, 
      message: 'OAuth temporarily unavailable. Using demo mode.',
      token: `dummy_${provider}_${Date.now()}`,
      provider,
    });
  } else {
    res.json({ 
      ok: true, 
      dummy: true, 
      message: 'OAuth not configured. Using demo mode.',
      token: `dummy_${provider}_${Date.now()}`,
      provider,
    });
  }
});

const handleOAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.query;
  const provider = req.path.split('/')[2];
  const hasApiKey = !!(env.COMPOSIO_API_KEY || env.RUBE_API_KEY);

  if (code && hasApiKey) {
    // In production, complete OAuth flow here
    log.info(`OAuth callback received for ${provider}, using dummy mode`);
    res.json({ 
      ok: true, 
      dummy: true,
      provider,
      token: `dummy_${provider}_${Date.now()}`,
      message: 'OAuth callback received. Complete OAuth flow implementation needed.'
    });
  } else {
    res.status(400).json({ 
      ok: false, 
      error: 'no_code',
      message: 'OAuth callback received without authorization code.'
    });
  }
});

// OAuth Login endpoints
app.post('/auth/github/login', rateLimiters.standard, handleOAuthLogin);
app.post('/auth/slack/login', rateLimiters.standard, handleOAuthLogin);
app.post('/auth/google/login', rateLimiters.standard, handleOAuthLogin);

// OAuth Callback endpoints
app.get('/auth/github/callback', handleOAuthCallback);
app.get('/auth/slack/callback', handleOAuthCallback);
app.get('/auth/google/callback', handleOAuthCallback);

// Root endpoint - API information
app.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    name: 'Sutradhar API',
    version: '1.0.0',
    description: 'AI-powered assistant API with retrieval, actions, and LLM capabilities',
    documentation: '/api/v1/docs',
    health: '/health',
    endpoints: {
      v1: '/api/v1',
      health: '/health',
      metrics: '/metrics',
      docs: '/api/v1/docs'
    }
  });
}));

// API v1 routes
// Legacy v1 routes (backward compatibility)
app.use('/api/v1', v1Routes);

// Unified API routes (new standard - all external APIs abstracted)
app.use('/api/unified', unifiedApiRoutes);

// EdTech routes (Apex Academy) - Agent-based architecture
app.use('/', edtechRoutesV2);

// Legacy EdTech routes (for backward compatibility)
// app.use('/', edtechRoutes);

// Initialize plugins on startup
let pluginsInitialized = false;
(async () => {
  try {
    await initializePlugins();
    pluginsInitialized = true;
    log.info('Server initialized with plugin architecture');
  } catch (error) {
    log.error('Failed to initialize plugins', error);
  }
})();

// ========== Health & Diagnostics ==========

// Metrics endpoint (before other routes)
app.get('/metrics', rateLimiters.lenient, asyncHandler(async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}));

// Heartbeat endpoint - simple ping for monitoring
app.get('/health/heartbeat', async (_req: Request, res: Response) => {
  const status = healthMonitor.getHeartbeatStatus();
  res.json({
    ok: status.overallHealth,
    timestamp: status.timestamp,
    uptime: status.uptime,
    serviceName: status.serviceName,
    version: status.version,
  });
});

// Health dashboard API endpoint
app.get('/health/dashboard', rateLimiters.lenient, timeouts.health, asyncHandler(async (_req: Request, res: Response) => {
  const status = healthMonitor.getHeartbeatStatus();
  const summary = healthMonitor.getHealthSummary();
  
  res.json({
    ok: status.overallHealth,
    service: {
      name: status.serviceName,
      version: status.version,
      environment: status.environment,
      uptime: status.uptime,
      startTime: Date.now() - status.uptime,
    },
    summary,
    endpoints: status.endpoints,
    timestamp: status.timestamp,
  });
}));

app.get('/health', rateLimiters.lenient, timeouts.health, asyncHandler(async (req: Request, res: Response) => {
    const inboxId = await emailService.resolveInboxId(false);
    const mode = env.AGENTMAIL_API_KEY ? 'real' : 'mock';
    
  res.json({
      ok: true,
      mode,
      message: `Server is running in ${mode} mode.`,
      agentmail: {
        fromAddress: env.AGENTMAIL_FROM_ADDRESS || null,
        fromName: env.AGENTMAIL_FROM_NAME || null,
        inboxResolved: inboxId !== null,
      },
  });
}));

app.get('/health/full', rateLimiters.lenient, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
    const healthStatuses = await pluginRegistry.getHealthStatus();
    const services: any = {};

    // Convert plugin health to service health format
    for (const [name, status] of healthStatuses.entries()) {
      const plugin = await pluginRegistry.get(name).catch(() => null);
      const isMock = plugin?.config?.mock ?? false;
      
      services[name] = {
        ok: status.healthy,
        status: status.status,
        mode: isMock ? 'mock' : 'real',
        message: status.message,
        latency: status.latency,
      };
    }

    // Legacy service checks for backward compatibility
    const out: any = { ok: true, services };

    // Convex
    try {
      if (!process.env.CONVEX_URL) throw new Error("CONVEX_URL missing");
      const r = await fetch(`${process.env.CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "sessions:list", args: {}, format: "json" })
      });
      services.convex = { ...services.data, url: process.env.CONVEX_URL };
    } catch (e: any) {
      services.convex = { ok: false, error: e.message };
      out.ok = false;
    }

    // LLM
    services.llm = {
      openai: !!process.env.OPENAI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      default: process.env.LLM_DEFAULT_PROVIDER || "openai",
      mock: String(process.env.MOCK_LLM || "true")
    };

    // Retrieval status
    const retrievalStatus = await retrievalService.getStatus();
    services.retrieval = {
      ...services.retrieval,
      docs: retrievalStatus.docCount,
      engine: retrievalStatus.engine,
    };

  // LiveKit status (optional)
  services.livekit = {
    ok: !!(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET),
    url: env.LIVEKIT_URL || null,
  };

  // Demo readiness gate
  const blockers: string[] = [];
  const convexOk = services.convex?.ok === true;
  const retrievalOk = retrievalStatus.docCount > 0;
  const livekitOk = services.livekit?.ok === true;

  if (!convexOk) blockers.push('convex_down');
  if (!retrievalOk) blockers.push('no_local_docs');
  if (!livekitOk) blockers.push('livekit_unset');

  out.demo_ready = convexOk && retrievalOk && livekitOk;
  if (!out.demo_ready && blockers.length > 0) {
    out.blockers = blockers;
  }
    out.message = 'Full health check complete.';

  res.json(out);
}));

app.get('/convex/diag', rateLimiters.lenient, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
    const result = await convexSelfTest();
  res.json({
      ...result,
      message: result.ok ? 'Convex diagnostics complete.' : undefined
});
}));

// ========== Email ==========
// Legacy endpoint - redirects to v1
app.post('/agentmail/send', 
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SendEmailSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const validationResult = SendEmailSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid payload',
        details: validationResult.error.errors,
      });
    }

    const replyTo = env.AGENTMAIL_FROM_ADDRESS 
      ? `${env.AGENTMAIL_FROM_NAME || 'Sutradhar Support'} <${env.AGENTMAIL_FROM_ADDRESS}>`
      : undefined;

    // Use test recipient in dry-run mode or if specified
    const recipient = (env.AGENTMAIL_DRY_RUN === 'true' && env.AGENTMAIL_TEST_TO)
      ? env.AGENTMAIL_TEST_TO
      : (validationResult.data.to || env.AGENTMAIL_FROM_ADDRESS || env.AGENTMAIL_DEFAULT_TO);

    const payload = {
      to: recipient,
      subject: validationResult.data.subject || '[Escalation][P1] Test Send',
      text: validationResult.data.text,
      ...(validationResult.data.cc && { cc: validationResult.data.cc }),
      ...(validationResult.data.bcc && { bcc: validationResult.data.bcc }),
      headers: {
        ...(validationResult.data.headers || {}),
        ...(replyTo && { 'Reply-To': replyTo }),
      },
    };

    const result = await emailService.sendEmail(payload);
    
    if (!result.ok) {
      const statusCode = result.error?.includes('INBOX_NOT_FOUND') ? 428 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json({
      ...result,
      message: 'Email sent successfully.'
    });
  })
);

// ========== Actions ==========
// Legacy endpoints - kept for backward compatibility, v1 endpoints also available at /api/v1/actions/*

const SlackSchema = z.object({ text: z.string().min(1), channelId: z.string().optional(), sessionId: z.string().optional() });
const CalSchema = z.object({
  title: z.string().min(1),
  startISO: z.string().min(1),
  endISO: z.string().min(1),
  description: z.string().optional(),
  calendarId: z.string().optional(),
  sessionId: z.string().optional()
});
const GhSchema = z.object({ title: z.string().min(1), body: z.string().default(""), repoSlug: z.string().optional(), sessionId: z.string().optional() });
const ForumSchema = z.object({
  url: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  text: z.string().min(1),
  sessionId: z.string().optional()
});

app.post("/actions/slack",
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: SlackSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = SlackSchema.parse(req.body);
    const result = await actionService.executeAction('slack', p);
    
    // Record action metrics
    actionRequestsTotal.inc({
      action_type: 'slack',
      status: result.ok ? 'success' : 'error',
    });
    
    if (result.ok && result.data && p.sessionId) {
      // Append success message to transcript
      if (!result.mocked) {
        const permalink = (result.data as any)?.data?.permalink || (result.data as any)?.data?.message?.permalink;
        const message = permalink ? `Posted to Slack ✅ ${permalink}` : "Posted to Slack ✅";
        await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
      }
    }
    
    res.json({
      ...result,
      message: result.ok ? 'Slack message sent successfully.' : undefined
    });
  })
);

app.post("/actions/slack/cleanup-and-post",
  rateLimiters.lenient,
  timeouts.expensive,
  asyncHandler(async (req: Request, res: Response) => {
    const { text, channelId, searchPhrase } = req.body;
    const channel = channelId || "C09Q8AD2KHS";
    const phrase = searchPhrase || text || "Suzane in SF";
    
    log.info(`Starting cleanup: deleting messages that don't contain "${phrase}"`);
    
    try {
      const { slackListMessages, slackDeleteMessage } = await import('./integrations/actions/slack');
      
      // List messages
      const messagesResult: any = await slackListMessages(channel, 100);
      const messages = Array.isArray(messagesResult) 
        ? messagesResult 
        : ((messagesResult as any)?.data?.messages || (messagesResult as any)?.data || []);
      const deleted: string[] = [];
      const kept: string[] = [];
      
      // Delete messages that don't contain the phrase
      for (const msg of messages) {
        const msgText = msg.text || msg.message?.text || "";
        const msgTs = msg.ts || msg.message?.ts || msg.timestamp;
        
        if (!msgTs) continue;
        
        if (!msgText.toLowerCase().includes(phrase.toLowerCase())) {
          try {
            await slackDeleteMessage(channel, msgTs);
            deleted.push(msgTs);
            log.info(`Deleted message ts=${msgTs}`);
          } catch (err: any) {
            log.warn(`Failed to delete ts=${msgTs}: ${err.message}`);
          }
        } else {
          kept.push(msgTs);
          log.info(`Kept message ts=${msgTs} (contains "${phrase}")`);
        }
      }
      
      // Send new message
      const sendResult = await actionService.executeAction('slack', { text, channelId: channel });
      
      res.json({
        ok: true,
        deleted: deleted.length,
        kept: kept.length,
        newMessage: sendResult.ok,
        deletedTimestamps: deleted,
        keptTimestamps: kept
      });
    } catch (error: any) {
      log.error('Cleanup failed', error);
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  })
);

app.post("/actions/calendar",
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: CalSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = CalSchema.parse(req.body);
    const result = await actionService.executeAction('calendar', p);
    
    // Record action metrics
    actionRequestsTotal.inc({
      action_type: 'calendar',
      status: result.ok ? 'success' : 'error',
    });
    
    if (result.ok && result.data && p.sessionId) {
      if (!result.mocked) {
        const htmlLink = (result.data as any)?.data?.htmlLink;
        const message = htmlLink ? `Created calendar event ✅ ${htmlLink}` : `Created calendar event ✅ "${p.title}"`;
        await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
      }
    }
    
    res.json({
      ...result,
      message: result.ok ? 'Calendar event created successfully.' : undefined
    });
  })
);

app.post("/actions/github",
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: GhSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = GhSchema.parse(req.body);
    const result = await actionService.executeAction('github', p);
    
    // Record action metrics
    actionRequestsTotal.inc({
      action_type: 'github',
      status: result.ok ? 'success' : 'error',
    });
    
    if (result.ok && result.data && p.sessionId) {
      if (!result.mocked) {
        const htmlUrl = (result.data as any)?.data?.html_url || (result.data as any)?.data?.url;
        const issueNum = (result.data as any)?.data?.number;
        const message = htmlUrl ? `Created GitHub issue ✅ #${issueNum || 'N/A'} ${htmlUrl}` : `Created GitHub issue ✅ "${p.title}"`;
        await sessionService.appendMessage(p.sessionId, "agent", message, [], 0);
      }
    }
    
    res.json({
      ...result,
      message: result.ok ? 'GitHub issue created successfully.' : undefined
    });
  })
);

app.post("/forum/post",
  rateLimiters.strict,
  timeouts.standard,
  validate({ body: ForumSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = ForumSchema.parse(req.body);
    const result = await actionService.executeAction('forum', p);
    
    if (result.ok && p.sessionId) {
      const data = result.data as any;
      await sessionService.appendMessage(
        p.sessionId,
        "agent",
        result.mocked ? `Mocked forum post ✅` : `Posted to forum ✅`,
        [{ type: "screenshot", id: data?.screenshot || '', title: "Forum screenshot", url: data?.url || '' }],
        0
      );
    }
    
    res.status(result.ok ? 200 : 500).json({
      ...result,
      message: result.ok ? 'Forum post created successfully.' : undefined
    });
  })
);

app.get("/actions/list",
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || "");
    if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });
    
    const actions = await actionService.getActionsBySession(sessionId);
    res.json({
      ok: true, 
      sessionId, 
      actions,
      message: `Found ${actions.length} action(s) for this session.`
});
  })
);

// ========== LLM ==========
// Legacy endpoints - kept for backward compatibility, v1 endpoints also available at /api/v1/llm/*

const LlmSchema = z.object({
  sessionId: z.string().optional(),
  question: z.string().min(1),
  provider: z.enum(["openai","perplexity"]).optional(),
  model: z.string().optional()
});

app.post("/llm/answer",
  rateLimiters.strict,
  timeouts.expensive,
  validate({ body: LlmSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = LlmSchema.parse(req.body);
    
    // Deduplicate identical LLM requests (within 5 seconds)
    const dedupeKey = `llm:${p.question}:${p.provider || 'default'}:${p.model || 'default'}`;
    
    const result = await deduplicateOperation(
      dedupeKey,
      async () => {
        // Apply guardrails before sending to LLM
        const guardrailCheck = await checkGuardrails(p.question, undefined, 'default');
        if (!guardrailCheck.allowed) {
          log.warn('LLM query blocked by guardrails', {
            question: p.question,
            category: guardrailCheck.category,
          });
          
          if (p.sessionId) {
            await sessionService.appendMessage(
              p.sessionId,
              "user",
              p.question,
              [],
              0
            );
            await sessionService.appendMessage(
              p.sessionId,
              "agent",
              guardrailCheck.reason || 'I cannot answer this question.',
              [],
              0
            );
          }
          
          return {
            ok: false,
            text: guardrailCheck.reason || 'I cannot answer this question.',
            error: 'Query blocked by guardrails',
            blocked: true,
          };
        }
        
        const llmResult = await llmService.chat({
      system: SYSTEM_ANSWER,
      user: p.question,
      provider: p.provider,
      model: p.model,
    });
    
        // Record LLM metrics
        llmRequestsTotal.inc({
          provider: p.provider || 'default',
          status: llmResult.ok ? 'success' : 'error',
        });
        
        if (llmResult.ok && llmResult.data && p.sessionId) {
          await sessionService.appendMessage(p.sessionId, "agent", llmResult.data.text, [], 0);
    }
    
        return {
          ok: llmResult.ok,
          text: llmResult.data?.text || '',
          error: llmResult.error,
          message: llmResult.ok ? 'LLM response generated.' : undefined
        };
      },
      5000 // 5 second deduplication window
    );
    
    res.json(result);
  })
);

app.post("/llm/summarize",
  rateLimiters.strict,
  timeouts.expensive,
  asyncHandler(async (req: Request, res: Response) => {
    const body = String(req.body?.body || "");
    if (!body) {
      return res.status(400).json({ ok: false, error: "body required" });
    }
    
    const result = await llmService.chat({
      system: SYSTEM_SUMMARIZE,
      user: body,
    });
    
    res.json({
      ok: result.ok, 
      text: result.data?.text || '', 
      error: result.error,
      message: result.ok ? 'LLM response generated.' : undefined
    });
  })
);

app.post("/llm/escalate",
  rateLimiters.strict,
  timeouts.expensive,
  asyncHandler(async (req: Request, res: Response) => {
    const body = String(req.body?.body || "");
    if (!body) {
      return res.status(400).json({ ok: false, error: "body required" });
    }
    
    const result = await llmService.chat({
      system: SYSTEM_ESCALATE,
      user: body,
    });
    
    res.json({
      ok: result.ok, 
      text: result.data?.text || '', 
      error: result.error,
      message: result.ok ? 'LLM response generated.' : undefined
});
  })
);

// ========== Answer & Retrieval ==========
// Legacy endpoints - kept for backward compatibility, v1 endpoints also available at /api/v1/answer and /api/v1/retrieval/*

const AnswerSchema = z.object({
  sessionId: z.string().optional().default("demo-session"),
  question: z.string().min(1)
});

app.post("/api/answer",
  rateLimiters.perSession,
  timeouts.expensive,
  validate({ body: AnswerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const p = AnswerSchema.parse(req.body);
    
    // Deduplicate identical answer requests
    const dedupeKey = `answer:${p.sessionId}:${p.question}`;
    const result = await deduplicateOperation(
      dedupeKey,
      async () => {
        return await answerService.answerQuestion(p.sessionId!, p.question);
      },
      5000
    );
    
    res.json({
      ok: true,
      ...result,
      message: 'AI assistant responded.'
    });
  })
);

app.post("/retrieval/indexSeed",
  rateLimiters.strict,
  timeouts.indexing,
  asyncHandler(async (req: Request, res: Response) => {
    // Import dynamically to avoid circular deps
    const { indexSeedLocal } = await import("./retrieval/indexSeed");
    const r = await indexSeedLocal();
    res.json({
      ok: true, 
      docCount: r.docCount,
      message: `Indexed ${r.docCount} document(s) successfully.`
});
  })
);

// ========== Diagnostics ==========

app.get("/diag/composio", // Legacy endpoint name - now uses Rube.app
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const r = await runComposioDiag();
    res.json({
      ...r,
      message: r.ok ? 'Rube.app diagnostics complete (legacy /diag/composio endpoint).' : undefined
    });
  })
);

// Test Rube.app connection endpoint (legacy - now handled via v1 routes)
app.get("/diag/rube/test",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    // Legacy endpoint - redirect to diagnostics
    const result = await runComposioDiag();
    res.json({
      ...result,
      message: 'Legacy /diag/rube/test endpoint. Use /diag/composio for diagnostics.'
    });
  })
);

app.get("/diag/agentmail",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const r = await agentmailSelfCheck();
    res.json({
      ok: true, 
      ...r,
      message: 'AgentMail diagnostics complete.'
});
  })
);

app.get("/diag/hyperspell",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
  const result = await hyperspellDiag();
    res.json({
    ...result,
    message: result.ok ? 'Hyperspell diagnostics complete.' : undefined
});
  })
);

// ========== Admin ==========

app.get("/admin/guardrails",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const guardrails = guardrailRegistry.list();
    const personas = ['default', 'greeter', 'moderator', 'escalator', 'strict', 'lenient', 'technical'];
    
    res.json({
      ok: true,
      guardrails: guardrails.map(g => ({
        name: g.name,
        category: g.category,
        description: g.description,
      })),
      personas: personas.map(p => ({
        name: p,
        config: guardrailRegistry.getPersonaConfig(p),
      })),
    });
  })
);

app.get("/admin/guardrails/metrics",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const metrics = guardrailRegistry.getMetrics();
    res.json({
      ok: true,
      metrics,
      timestamp: Date.now(),
    });
  })
);

app.post("/admin/guardrails/persona",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const persona = String(req.body?.persona || "");
    const config = req.body?.config;
    
    if (!persona || !config) {
      return res.status(400).json({ ok: false, error: "persona and config required" });
    }
    
    guardrailRegistry.configurePersona(persona, config);
    
    res.json({
      ok: true,
      message: `Persona ${persona} configured successfully.`,
    });
  })
);

app.post("/admin/toggle",
  // Admin toggle is exempt from rate limits (for internal operations)
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const k = String(req.body?.key || "");
    const v = String(req.body?.value || "");
    if (!k) return res.status(400).json({ ok: false, error: "key required" });
    
    const r = setToggle(k, v);
    
    // Hot-reload plugins if toggle changed mock state
    if (['MOCK_ACTIONS', 'MOCK_LLM', 'MOCK_RETRIEVAL', 'MOCK_BROWSER'].includes(k)) {
      log.info(`Mock toggle changed: ${k}=${v}, plugins will use new state on next request`);
    }
    
    res.json({
      ...r,
      message: r.ok ? `Toggle ${k} set to ${v}. Configuration updated.` : undefined
    });
  })
);

app.post("/admin/circuit-breaker/reset",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const name = String(req.body?.name || "");
    if (name) {
      circuitBreakerRegistry.reset(name);
      res.json({
        ok: true,
        message: `Circuit breaker '${name}' reset successfully.`
      });
    } else {
      circuitBreakerRegistry.resetAll();
      res.json({
        ok: true,
        message: "All circuit breakers reset successfully."
      });
  }
  })
);

// ========== Voice ==========

app.get("/voice/token", rateLimiters.standard, timeouts.standard, asyncHandler(tokenRoute));

// LiveKit webhook endpoint for handling transcriptions
app.post("/webhooks/livekit/transcription",
  rateLimiters.standard,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { room, participant, transcript, is_final } = req.body;
      
      if (!transcript || !is_final) {
        return res.json({ ok: true }); // Acknowledge but skip processing
      }

      log.info(`LiveKit transcription received: "${transcript}" from ${participant?.identity} in room ${room?.name}`);

      // Process the transcribed message
      const result = await processVoiceMessage(
        room?.name || 'unknown',
        participant?.identity || 'unknown',
        transcript
      );

      if (result) {
        log.info(`Response generated: "${result.text.substring(0, 50)}..."`);
        // Note: To send audio response back, you'd need to integrate with LiveKit's TTS
        // For now, we just log the response
      }

      res.json({ ok: true, processed: !!result });
    } catch (error: any) {
      log.error('LiveKit webhook error', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  })
);

// ========== Legacy endpoints ==========

app.post("/dev/replay-webhook",
  rateLimiters.lenient,
  timeouts.standard,
  asyncHandler(async (req: Request, res: Response) => {
    const fixturePath = path.join(__dirname, 'agentmail/fixtures/example_webhook.json');
    let fixtureData: Buffer;
    try {
      fixtureData = await fs.readFile(fixturePath);
    } catch (error) {
      log.error('Failed to read webhook fixture', error);
      return res.status(500).json({
        ok: false,
        error: 'Failed to read webhook fixture file',
      });
    }

    const webhookUrl = `http://localhost:${env.PORT}/webhooks/agentmail`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (env.AGENTMAIL_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', env.AGENTMAIL_WEBHOOK_SECRET);
      hmac.update(fixtureData);
      headers['x-agentmail-signature'] = hmac.digest('hex');
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: fixtureData,
    });

    const responseData = await response.json() as { ok: boolean; error?: string };
    
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: 'Webhook endpoint returned error',
        details: responseData,
      });
    }

    res.json({
      ok: true,
      message: 'Webhook replayed successfully.',
      webhookResponse: responseData,
    });
  })
);

// Error handling middleware (must be last)
// Sentry error handler (before general error handler)
if (env.SENTRY_DSN) {
  try {
    const sentryNode = require('@sentry/node');
    const Handlers = sentryNode.Handlers || sentryNode;
    if (Handlers && Handlers.errorHandler) {
      app.use(Handlers.errorHandler());
    }
  } catch (e) {
    // Sentry error handler not available, continue without it
  }
}
app.use(errorHandler);

// Start server
const PORT = env.PORT;

app.listen(PORT, async () => {
  const mode = env.AGENTMAIL_API_KEY ? 'real' : 'mock';
  log.info(`🚀 Sutradhar API Server running on port ${PORT} (mode: ${mode})`);
  log.info(`API Root: http://localhost:${PORT}/`);
  log.info(`API v1: http://localhost:${PORT}/api/v1`);
  log.info(`Health: http://localhost:${PORT}/health`);
  log.info(`Metrics: http://localhost:${PORT}/metrics`);
  log.info(`Heartbeat: http://localhost:${PORT}/health/heartbeat`);
  
  // Ensure plugins are initialized
  if (!pluginsInitialized) {
    try {
      await initializePlugins();
      pluginsInitialized = true;
    } catch (error) {
      log.error('Failed to initialize plugins on startup', error);
    }
  }
  
  if (pluginsInitialized) {
    log.info('✅ Plugins initialized successfully');
  } else {
    log.warn('⚠️  Plugins not yet initialized - some endpoints may fail');
  }

  // Start health monitoring heartbeat
  healthMonitor.startHeartbeat(30000); // 30 seconds
  
  // Start cleanup interval
  setInterval(() => {
    healthMonitor.cleanup();
  }, 10 * 60 * 1000); // Every 10 minutes

  // Register graceful shutdown handlers
  shutdownService.register();

  // Start log cleanup job
  startLogCleanup();

  logger.info('Server fully initialized', {
    service: 'server',
    port: PORT,
    environment: env.NODE_ENV,
  });
});
