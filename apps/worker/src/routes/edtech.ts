/**
 * EdTech API Routes for Apex Academy
 * All routes are served at root level (not /api/v1) for simplicity
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { accessSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Convex } from '../convexClient';
import { answerService } from '../core/services/answer-service';
import { emailService } from '../core/services/email-service';
import { actionService } from '../core/services/action-service';
import { llmService } from '../core/services/llm-service';
import { asyncHandler, rateLimiters, validate, timeouts } from '../core/middleware';
import { log } from '../log';
import { env } from '../env';

const router = Router();

// Magic link tokens (in-memory for demo, use Redis in production)
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

// ========== Auth Routes ==========

router.post('/auth/guest', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const result: any = await Convex.mutations('users:createGuest', {});
  if (!result || result.skipped) {
    // Fallback guest user
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return res.json({
      ok: true,
      user: {
        id: guestId,
        email: `guest_${guestId}@apex.local`,
        name: `Guest ${guestId.substring(6, 12)}`,
        role: 'guest',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        streak: 0,
        badges: []
      },
      sessionId: `session_${guestId}`
    });
  }
  
  const sessionId = `session_${result.userId}`;
  res.json({
    ok: true,
    user: result.user,
    sessionId
  });
}));

router.post('/auth/magic', rateLimiters.strict, validate({
  body: z.object({ email: z.string().email() })
}), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 3600000; // 1 hour
  
  magicTokens.set(token, { email, expiresAt });
  
  // Send via AgentMail (dry-run if configured)
  const emailResult = await emailService.sendEmail({
    to: email,
    subject: 'Apex Academy Magic Link',
    text: `Click this link to login: ${env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}`
  });
  
  res.json({
    ok: true,
    message: emailResult.mocked ? 'Magic link would be sent (dry-run mode)' : 'Magic link sent',
    mocked: emailResult.mocked
  });
}));

router.post('/auth/verify', rateLimiters.strict, validate({
  body: z.object({ token: z.string() })
}), asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const tokenData = magicTokens.get(token);
  
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    magicTokens.delete(token);
    return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  }
  
  magicTokens.delete(token);
  
  const result: any = await Convex.mutations('users:createOrGet', {
    email: tokenData.email
  });
  
  const sessionId = `session_${result.userId}`;
  res.json({
    ok: true,
    user: result.user,
    sessionId
  });
}));

// ========== Catalog Routes ==========

router.get('/catalog', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  // Try multiple possible paths for data_repository
  const possiblePaths = [
    path.join(process.cwd(), '..', 'data_repository'),
    path.join(process.cwd(), '..', '..', 'data_repository'),
    path.join(__dirname, '..', '..', '..', '..', 'data_repository')
  ];
  
  let dataRepoPath = possiblePaths.find(p => {
    try {
      accessSync(p);
      return true;
    } catch {
      return false;
    }
  }) || possiblePaths[0];
  const courses: any[] = [];
  
  try {
    const dirs = await fs.readdir(dataRepoPath, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory() && !dir.name.startsWith('.')) {
        const courseSlug = dir.name.toLowerCase().replace(/\s+/g, '-');
        const files = await fs.readdir(path.join(dataRepoPath, dir.name));
        const lessonFiles = files.filter(f => f.endsWith('.md') && f.startsWith('Lesson_'));
        
        // Upsert course in Convex
        await Convex.mutations('courses:upsert', {
          slug: courseSlug,
          title: dir.name,
          description: `Learn ${dir.name} with interactive lessons and quizzes`,
          coverImg: ''
        });
        
        courses.push({
          slug: courseSlug,
          title: dir.name,
          description: `Learn ${dir.name} with interactive lessons and quizzes`,
          lessonCount: lessonFiles.length
        });
      }
    }
  } catch (error: any) {
    log.error('Failed to scan data_repository', error);
  }
  
  res.json({ ok: true, courses });
}));

router.get('/course/:slug/lessons', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const possiblePaths = [
    path.join(process.cwd(), '..', 'data_repository'),
    path.join(process.cwd(), '..', '..', 'data_repository'),
    path.join(__dirname, '..', '..', '..', '..', 'data_repository')
  ];
  
  let dataRepoPath = possiblePaths.find(p => {
    try {
      fs.accessSync(p);
      return true;
    } catch {
      return false;
    }
  }) || possiblePaths[0];
  const courseDir = path.join(dataRepoPath, slug.replace(/-/g, ' '));
  const lessons: any[] = [];
  
  try {
    const files = await fs.readdir(courseDir);
    const lessonFiles = files.filter(f => f.endsWith('.md') && f.startsWith('Lesson_'));
    
    for (const file of lessonFiles) {
      const lessonId = file.replace('.md', '');
      const content = await fs.readFile(path.join(courseDir, file), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : lessonId;
      
      // Upsert lesson in Convex
      await Convex.mutations('lessons:upsert', {
        courseSlug: slug,
        lessonId,
        title,
        body: content,
        assets: [],
        difficulty: 'beginner'
      });
      
      lessons.push({ id: lessonId, title, courseSlug: slug });
    }
  } catch (error: any) {
    log.error('Failed to load lessons', error);
  }
  
  res.json({ ok: true, lessons });
}));

router.get('/lesson/:id', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sessionId = String(req.query.sessionId || 'demo-session');
  
  // Extract course and lesson from ID (format: courseSlug-lessonId or just lessonId)
  const parts = id.split('-');
  let courseSlug = '';
  let lessonId = id;
  
  // Try to find in Convex first
  const allCourses: any = await Convex.queries('courses:list', {});
  const coursesArray = Array.isArray(allCourses) ? allCourses : [];
  for (const course of coursesArray) {
    const lesson = await Convex.queries('lessons:get', {
      courseSlug: course.slug,
      lessonId: id
    });
    if (lesson) {
      courseSlug = course.slug;
      lessonId = id;
      break;
    }
  }
  
  if (!courseSlug) {
    // Fallback: scan data_repository
    const possiblePaths = [
      path.join(process.cwd(), '..', 'data_repository'),
      path.join(process.cwd(), '..', '..', 'data_repository'),
      path.join(__dirname, '..', '..', '..', '..', 'data_repository')
    ];
    
    let dataRepoPath = possiblePaths.find(p => {
      try {
        accessSync(p);
        return true;
      } catch {
        return false;
      }
    }) || possiblePaths[0];
    const dirs = await fs.readdir(dataRepoPath, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const files = await fs.readdir(path.join(dataRepoPath, dir.name));
        if (files.some(f => f === `${id}.md` || f === `Lesson_${id}.md`)) {
          courseSlug = dir.name.toLowerCase().replace(/\s+/g, '-');
          const file = files.find(f => f === `${id}.md` || f === `Lesson_${id}.md`)!;
          lessonId = file.replace('.md', '');
          break;
        }
      }
    }
  }
  
  if (!courseSlug) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = await Convex.queries('lessons:get', { courseSlug, lessonId });
  
  if (!lesson) {
    // Try reading from file
    const possiblePaths = [
      path.join(process.cwd(), '..', 'data_repository'),
      path.join(process.cwd(), '..', '..', 'data_repository'),
      path.join(__dirname, '..', '..', '..', '..', 'data_repository')
    ];
    
    let dataRepoPath = possiblePaths.find(p => {
      try {
        accessSync(p);
        return true;
      } catch {
        return false;
      }
    }) || possiblePaths[0];
    const courseDir = path.join(dataRepoPath, courseSlug.replace(/-/g, ' '));
    const content = await fs.readFile(path.join(courseDir, `${lessonId}.md`), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    
    res.json({
      ok: true,
      lesson: {
        id: lessonId,
        courseSlug,
        title: titleMatch ? titleMatch[1] : lessonId,
        body: content,
        assets: []
      }
    });
    return;
  }
  
  res.json({ ok: true, lesson });
}));

// ========== Images Route ==========

router.get('/course/:slug/images', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const keywords = String(req.query.keywords || slug);
  
  const images: any[] = [];
  
  // Try Moss bridge if configured
  if (env.MOSS_BRIDGE_URL) {
    try {
      const mossResponse = await fetch(`${env.MOSS_BRIDGE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keywords, limit: 10 })
      });
      
      if (mossResponse.ok) {
        const mossData: any = await mossResponse.json();
        if (mossData.images && Array.isArray(mossData.images)) {
          for (const img of mossData.images) {
            await Convex.mutations('images:upsert', {
              courseSlug: slug,
              url: img.url || img,
              source: 'moss',
              caption: img.caption || keywords
            });
            images.push({
              url: img.url || img,
              source: 'moss',
              caption: img.caption || keywords
            });
          }
        }
      }
    } catch (error: any) {
      log.warn('Moss bridge failed, falling back to local', error);
    }
  }
  
  // Fallback to local images
  if (images.length === 0) {
    const localImgPath = path.join(process.cwd(), '..', '..', 'apps', 'nuxt', 'public', 'img', slug);
    try {
      const files = await fs.readdir(localImgPath);
      for (const file of files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))) {
        images.push({
          url: `/img/${slug}/${file}`,
          source: 'local',
          caption: file.replace(/\.[^.]+$/, '')
        });
      }
    } catch {
      // No local images
    }
  }
  
  res.json({ ok: true, images });
}));

// ========== Quiz Routes ==========

router.get('/quiz/:id', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quiz = await Convex.queries('quizzes:get', { quizId: id });
  
  if (!quiz) {
    return res.status(404).json({ ok: false, error: 'Quiz not found' });
  }
  
  res.json({ ok: true, quiz });
}));

router.post('/quiz/:id/attempt', rateLimiters.standard, validate({
  body: z.object({
    userId: z.string(),
    answers: z.array(z.any()),
    startedAt: z.number(),
    finishedAt: z.number()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, answers, startedAt, finishedAt } = req.body;
  
  const quiz: any = await Convex.queries('quizzes:get', { quizId: id });
  if (!quiz) {
    return res.status(404).json({ ok: false, error: 'Quiz not found' });
  }
  
  // Calculate score
  const questions = (quiz.questions || []) as Array<{ correctAnswer: any }>;
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctAnswer || 
        JSON.stringify(answers[i]) === JSON.stringify(questions[i].correctAnswer)) {
      correct++;
    }
  }
  const score = (correct / questions.length) * 100;
  
  await Convex.mutations('quizzes:recordAttempt', {
    userId,
    quizId: id,
    score,
    answers,
    startedAt,
    finishedAt
  });
  
  // Log event
  await Convex.mutations('events:log', {
    userId,
    type: 'quiz_attempt',
    payload: { quizId: id, score, passed: score >= quiz.passScore }
  });
  
  res.json({
    ok: true,
    score,
    passed: score >= quiz.passScore,
    correct,
    total: questions.length
  });
}));

// ========== Code Assignment Routes ==========

router.get('/code/:assignmentId', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const assignment = await Convex.queries('codeAssignments:get', { assignmentId });
  
  if (!assignment) {
    return res.status(404).json({ ok: false, error: 'Assignment not found' });
  }
  
  res.json({ ok: true, assignment });
}));

router.post('/code/:assignmentId/hint', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    code: z.string(),
    failingTest: z.string().optional(),
    sessionId: z.string().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const { code, failingTest, sessionId } = req.body;
  
  const assignment: any = await Convex.queries('codeAssignments:get', { assignmentId });
  if (!assignment) {
    return res.status(404).json({ ok: false, error: 'Assignment not found' });
  }
  
  const systemPrompt = `You are a coding tutor. Provide hints and Socratic questions. **Never write the full solution.** 
If code is requested, show at most a 3-line snippet or pseudocode; redact the rest.
Focus on guiding the student to discover the solution themselves.`;

  const userPrompt = `Assignment: ${assignment.prompt || ''}\n\nStudent's current code:\n\`\`\`${assignment.language || 'javascript'}\n${code}\n\`\`\`\n\n${failingTest ? `Failing test: ${failingTest}` : 'Provide a hint to get started.'}`;
  
  const result = await llmService.chat({
    system: systemPrompt,
    user: userPrompt
  });
  
  if (!result.ok) {
    return res.status(500).json({ ok: false, error: result.error });
  }
  
  let hintText = result.data?.text || '';
  
  // Redact guard: if response has > 5 lines of code, truncate middle
  const codeBlockRegex = /```[\s\S]*?```/g;
  hintText = hintText.replace(codeBlockRegex, (match) => {
    const lines = match.split('\n');
    if (lines.length > 7) {
      return lines.slice(0, 3).join('\n') + '\n[... code redacted ...]\n' + lines.slice(-3).join('\n');
    }
    return match;
  });
  
  res.json({ ok: true, hint: hintText });
}));

router.post('/code/:assignmentId/run', rateLimiters.strict, timeouts.standard, validate({
  body: z.object({
    code: z.string(),
    language: z.string()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const { code, language } = req.body;
  
  const assignment = await Convex.queries('codeAssignments:get', { assignmentId });
  if (!assignment) {
    return res.status(404).json({ ok: false, error: 'Assignment not found' });
  }
  
  const tests = assignment.tests || [];
  const results = [];
  let passed = 0;
  
  // Simple sandbox execution (Node.js only for demo)
  // TODO: Implement proper sandboxing with vm2 or separate process
  if (language === 'javascript' || language === 'node') {
    try {
      // Basic validation: strip dangerous patterns
      if (code.includes('require(') || code.includes('import(') || code.includes('eval(') || code.includes('process.')) {
        throw new Error('Code contains disallowed patterns');
      }
      
      // Run tests (simplified - in production use proper sandbox)
      for (const test of tests) {
        try {
          // This is a simplified test runner - replace with proper sandbox in production
          const testFn = new Function('code', `return (${test.code})(code)`);
          const testPassed = testFn(code);
          results.push({ name: test.name, passed: testPassed, expected: test.expected, actual: test.actual });
          if (testPassed) passed++;
        } catch (error: any) {
          results.push({ name: test.name, passed: false, error: error.message });
        }
      }
    } catch (error: any) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  } else {
    // Python/other languages not yet supported in demo
    return res.status(501).json({ ok: false, error: `${language} runner not yet implemented` });
  }
  
  res.json({
    ok: true,
    passed,
    total: tests.length,
    cases: results
  });
}));

// ========== Assistant Routes ==========

router.post('/assistant/answer', rateLimiters.perSession, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    question: z.string()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, question } = req.body;
  
  const result = await answerService.answerQuestion(sessionId, question);
  
  res.json({
    ok: true,
    text: (result as any).text || '',
    sources: (result as any).sources || []
  });
}));

router.post('/assistant/escalate', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    reason: z.string(),
    email: z.string().email().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, reason, email } = req.body;
  
  const escalateResult = await llmService.chat({
    system: `Draft an escalation email for: ${reason}`,
    user: reason
  });
  
  if (email && escalateResult.ok) {
    await emailService.sendEmail({
      to: email,
      subject: '[Escalation] Apex Academy Support',
      text: escalateResult.data?.text || reason
    });
  }
  
  res.json({
    ok: true,
    text: escalateResult.data?.text || '',
    sent: !!email
  });
}));

router.post('/assistant/forum', rateLimiters.strict, timeouts.expensive, validate({
  body: z.object({
    sessionId: z.string(),
    text: z.string(),
    url: z.string().url().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, text, url } = req.body;
  
  const result = await actionService.executeAction('forum', {
    text,
    url,
    sessionId
  });
  
  res.json(result);
}));

router.post('/assistant/actions/:type', rateLimiters.strict, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { sessionId, ...payload } = req.body;
  
  if (!['slack', 'calendar', 'github'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid action type' });
  }
  
  const result = await actionService.executeAction(type, { ...payload, sessionId });
  res.json(result);
}));

// ========== Progress & Schedules ==========

router.get('/progress', rateLimiters.standard, validate({
  query: z.object({ userId: z.string() })
}), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  
  const attempts: any = await Convex.queries('quizzes:getAttempts', { userId });
  const events: any = await Convex.queries('events:getByUser', { userId, limit: 100 });
  const user: any = await Convex.queries('users:get', { userId: userId as any });
  
  res.json({
    ok: true,
    user,
    quizAttempts: attempts || [],
    events: events || [],
    streak: user?.streak || 0,
    badges: user?.badges || []
  });
}));

router.post('/schedule/study', rateLimiters.strict, timeouts.standard, validate({
  body: z.object({
    userId: z.string(),
    courseSlug: z.string().optional()
  })
}), asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug } = req.body;
  
  // Generate 2-week spaced repetition plan
  const events = [];
  const now = Date.now();
  const days = [1, 3, 7, 14]; // Spaced repetition intervals
  
  for (let i = 0; i < days.length; i++) {
    const startTime = new Date(now + days[i] * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
    
    events.push({
      title: courseSlug ? `Study ${courseSlug}` : 'Study Session',
      startISO: startTime.toISOString(),
      endISO: endTime.toISOString()
    });
  }
  
  // Create calendar events via Composio
  const createdEvents = [];
  for (const event of events) {
    const result = await actionService.executeAction('calendar', {
      ...event,
      sessionId: `schedule_${userId}`,
      description: 'Study session scheduled by Apex Academy'
    });
    
    if (result.ok) {
      await Convex.mutations('schedules:create', {
        userId,
        ...event,
        provider: 'google'
      });
      createdEvents.push(event);
    }
  }
  
  res.json({ ok: true, events: createdEvents });
}));

// ========== LiveKit Routes ==========

router.get('/room/:id/join', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = String(req.query.userId || 'anonymous');
  
  // Get token from existing voice route
  const tokenResult = await fetch(`${req.protocol}://${req.get('host')}/voice/token?room=${id}&identity=${userId}`, {
    method: 'GET'
  });
  
  if (!tokenResult.ok) {
    return res.status(500).json({ ok: false, error: 'Failed to get token' });
  }
  
  const tokenData: any = await tokenResult.json();
  
  // Generate agenda from progress (LLM summary)
  const attempts: any = await Convex.queries('quizzes:getAttempts', { userId });
  const agendaPrompt = `Summarize this student's progress into a study agenda: ${JSON.stringify(attempts)}`;
  
  const agendaResult = await llmService.chat({
    system: 'Create a concise study agenda',
    user: agendaPrompt
  });
  
  res.json({
    ok: true,
    token: tokenData.token,
    agenda: agendaResult.data?.text || 'Continue your learning journey!'
  });
}));

// ========== Admin Routes ==========

router.post('/admin/seed/index', rateLimiters.lenient, timeouts.indexing, asyncHandler(async (req: Request, res: Response) => {
  // Rebuild BM25 index
  const indexResult = await fetch(`${req.protocol}://${req.get('host')}/retrieval/indexSeed`, {
    method: 'POST'
  });
  
  res.json({
    ok: true,
    message: 'Index rebuilt',
    indexStatus: indexResult.ok
  });
}));

router.post('/admin/images/cache', rateLimiters.lenient, timeouts.standard, asyncHandler(async (req: Request, res: Response) => {
  const courses: any = await Convex.queries('courses:list', {});
  const cached = [];
  const coursesArray = Array.isArray(courses) ? courses : [];
  
  for (const course of coursesArray) {
    try {
      const imageResult = await fetch(`${req.protocol}://${req.get('host')}/course/${course.slug}/images?keywords=${course.title}`, {
        method: 'GET'
      });
      if (imageResult.ok) {
        cached.push(course.slug);
      }
    } catch (error) {
      // Skip failed courses
    }
  }
  
  res.json({ ok: true, cached });
}));

export { router as edtechRoutes };

