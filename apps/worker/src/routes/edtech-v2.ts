/**
 * EdTech API Routes v2 - Agent-Based Architecture
 * All routes delegate to lean, single-purpose agents
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, rateLimiters, validate, timeouts } from '../core/middleware';
import { agentRegistry } from '../agents';
import { log } from '../log';
import fetch from 'node-fetch';

const router = Router();

// ========== Auth Routes ==========

router.post('/auth/guest', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('AuthAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'AuthAgent not available' });
  }
  
  const result = await (agent as any).createGuest(req.body);
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/auth/magic', rateLimiters.strict, validate({
  body: z.object({ email: z.string().email() })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('AuthAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'AuthAgent not available' });
  }
  
  const result = await (agent as any).sendMagicLink(req.body.email, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error }),
    message: result.success ? 'Magic link sent' : undefined
  });
}));

router.post('/auth/verify', rateLimiters.strict, validate({
  body: z.object({ token: z.string() })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('AuthAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'AuthAgent not available' });
  }
  
  const result = await (agent as any).verifyToken(req.body.token, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 400).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Catalog Routes ==========

router.get('/catalog', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
  const result = await (agent as any).listCourses({ requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    courses: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/course/:slug/lessons', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
  const result = await (agent as any).listLessons(req.params.slug, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    lessons: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/lesson/:id', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
  // Extract course slug from lesson ID or query param
  const sessionId = String(req.query.sessionId || 'demo-session');
  const parts = req.params.id.split('-');
  const courseSlug = parts.length > 1 ? parts.slice(0, -1).join('-') : (req.query.courseSlug as string || '');
  const lessonId = parts.length > 1 ? parts[parts.length - 1] : req.params.id;
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'Course slug required' });
  }
  
  const result = await (agent as any).getLesson(courseSlug, lessonId, { sessionId, requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 404).json({
    ok: result.success,
    lesson: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error
  });
}));

// ========== Images Route ==========

router.get('/course/:slug/images', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('ImageAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'ImageAgent not available' });
  }
  
  const keywords = String(req.query.keywords || req.params.slug);
  const result = await (agent as any).getCourseImages(req.params.slug, keywords, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    images: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

// ========== Quiz Routes ==========

router.get('/quiz/:id', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('QuizAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'QuizAgent not available' });
  }
  
  const result = await (agent as any).getQuiz(req.params.id, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 404).json({
    ok: result.success,
    quiz: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error
  });
}));

router.post('/quiz/:id/attempt', rateLimiters.standard, validate({
  body: z.object({
    userId: z.string(),
    answers: z.array(z.any()),
    startedAt: z.number(),
    finishedAt: z.number()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('QuizAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'QuizAgent not available' });
  }
  
  const result = await (agent as any).submitAttempt({
    quizId: req.params.id,
    ...req.body
  }, { requestId: req.headers['x-request-id'] });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Code Assignment Routes ==========

router.get('/code/:assignmentId', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CodeAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CodeAgent not available' });
  }
  
  const result = await (agent as any).getAssignment(req.params.assignmentId, { requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 404).json({
    ok: result.success,
    assignment: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error
  });
}));

router.post('/code/:assignmentId/hint', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    code: z.string(),
    failingTest: z.string().optional(),
    sessionId: z.string().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('TutoringAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'TutoringAgent not available' });
  }
  
  // Get assignment to get prompt
  const codeAgent = agentRegistry.get('CodeAgent');
  const assignment = await (codeAgent as any).getAssignment(req.params.assignmentId);
  
  if (!assignment.success || !assignment.data) {
    return res.status(404).json({ ok: false, error: 'Assignment not found' });
  }
  
  const result = await (agent as any).getHint(
    assignment.data.prompt,
    req.body.code,
    req.body.failingTest,
    { sessionId: req.body.sessionId, requestId: req.headers['x-request-id'] }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/:assignmentId/run', rateLimiters.strict, timeouts.standard, validate({
  body: z.object({
    code: z.string(),
    language: z.string()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CodeAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CodeAgent not available' });
  }
  
  const result = await (agent as any).runCode({
    assignmentId: req.params.assignmentId,
    code: req.body.code,
    language: req.body.language
  }, { requestId: req.headers['x-request-id'] });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Assistant Routes ==========

router.post('/assistant/answer', rateLimiters.perSession, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    question: z.string()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('TutoringAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'TutoringAgent not available' });
  }
  
  const result = await (agent as any).answer(req.body.question, {
    sessionId: req.body.sessionId,
    requestId: req.headers['x-request-id']
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/escalate', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    reason: z.string(),
    email: z.string().email().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('TutoringAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'TutoringAgent not available' });
  }
  
  const result = await (agent as any).escalate(
    req.body.reason,
    req.body.email,
    { sessionId: req.body.sessionId, requestId: req.headers['x-request-id'] }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/forum', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    text: z.string(),
    url: z.string().url().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('NotificationAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'NotificationAgent not available' });
  }
  
  const result = await (agent as any).postToForum(
    req.body.text,
    req.body.url,
    { sessionId: req.body.sessionId, requestId: req.headers['x-request-id'] }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/actions/:type', rateLimiters.strict, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const agent = agentRegistry.get('NotificationAgent');
  
  if (!agent || !['slack'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid action type or agent not available' });
  }
  
  if (type === 'slack') {
    const result = await (agent as any).sendSlackMessage(
      req.body.text,
      req.body.channelId,
      { sessionId: req.body.sessionId, requestId: req.headers['x-request-id'] }
    );
    
    res.status(result.success ? 200 : 500).json({
      ok: result.success,
      ...(result.success ? result.data : { error: result.error })
    });
  } else {
    res.status(400).json({ ok: false, error: 'Action type not implemented via agent' });
  }
}));

// ========== Progress & Schedules ==========

router.get('/progress', rateLimiters.standard, validate({
  query: z.object({ userId: z.string() })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('ProgressAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'ProgressAgent not available' });
  }
  
  const result = await (agent as any).getProgress(req.query.userId as string, { requestId: req.headers['x-request-id'] });
  
  if (!result.success) {
    return res.status(500).json({ ok: false, error: result.error });
  }
  
  res.json({
    ok: true,
    user: { streak: result.data.streak, badges: result.data.badges },
    quizAttempts: [],
    events: result.data.recentEvents,
    streak: result.data.streak,
    badges: result.data.badges
  });
}));

router.post('/schedule/study', rateLimiters.strict, timeouts.standard, validate({
  body: z.object({
    userId: z.string(),
    courseSlug: z.string().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('StudyPlanAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'StudyPlanAgent not available' });
  }
  
  const result = await (agent as any).createPlan(
    req.body.userId,
    req.body.courseSlug,
    { sessionId: req.body.sessionId, requestId: req.headers['x-request-id'] }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    events: result.success ? result.data?.events : [],
    error: result.success ? undefined : result.error
  });
}));

// ========== LiveKit Routes ==========

router.get('/room/:id/join', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'anonymous');
  
  // Get token from existing voice route
  const tokenResult = await fetch(`${req.protocol}://${req.get('host')}/voice/token?room=${req.params.id}&identity=${userId}`, {
    method: 'GET'
  });
  
  if (!tokenResult.ok) {
    return res.status(500).json({ ok: false, error: 'Failed to get token' });
  }
  
  const tokenData = await tokenResult.json() as { token?: string; ok?: boolean };
  
  // Generate agenda from progress
  const progressAgent = agentRegistry.get('ProgressAgent');
  let agenda = 'Continue your learning journey!';
  
  if (progressAgent) {
    try {
      const progressResult = await (progressAgent as any).getProgress(userId);
      if (progressResult.success) {
        // Simple agenda generation (can be enhanced with LLM)
        agenda = `You've completed ${progressResult.data.quizAttempts} quizzes. Keep up the great work!`;
      }
    } catch (error) {
      // Non-fatal
    }
  }
  
  res.json({
    ok: true,
    token: tokenData.token || '',
    agenda
  });
}));

// ========== Admin Routes ==========

router.post('/admin/seed/index', rateLimiters.lenient, timeouts.indexing, asyncHandler(async (req: Request, res: Response) => {
  // Use unified knowledge API
  const indexResult = await fetch(`${req.protocol}://${req.get('host')}/api/v1/knowledge/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        id: 'seed_index',
        text: 'Index rebuild triggered',
        source: 'admin'
      }
    })
  });
  
  res.json({
    ok: indexResult.ok,
    message: 'Index rebuild triggered',
    indexStatus: indexResult.ok
  });
}));

router.post('/admin/images/cache', rateLimiters.lenient, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('ImageAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'ImageAgent not available' });
  }
  
  const result = await (agent as any).cacheAllImages({ requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// Agent info endpoint (for debugging)
router.get('/agents', rateLimiters.lenient, asyncHandler(async (req: Request, res: Response) => {
  res.json({
    ok: true,
    agents: agentRegistry.list()
  });
}));

export { router as edtechRoutesV2 };

