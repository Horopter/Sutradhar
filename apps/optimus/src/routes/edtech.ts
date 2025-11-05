/**
 * EdTech API Routes - Optimus Layer
 * Uses SutradharClient to execute agents via orchestrator
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SutradharClient } from '../client/sutradhar-client';
import { AuthAgent } from '../agents/auth-agent';
import { CourseAgent } from '../agents/course-agent';
import { TutoringAgent } from '../agents/tutoring-agent';
import { QuizAgent } from '../agents/quiz-agent';
import { CodeAgent } from '../agents/code-agent';
import { ProgressAgent } from '../agents/progress-agent';
import { ImageAgent } from '../agents/image-agent';
import { StudyPlanAgent } from '../agents/study-plan-agent';
import { NotificationAgent } from '../agents/notification-agent';

const router = Router();

// Initialize Sutradhar client
const sutradharClient = new SutradharClient(process.env.SUTRADHAR_URL || 'http://localhost:5000');

// Initialize agents with Sutradhar client
const authAgent = new AuthAgent(sutradharClient);
const courseAgent = new CourseAgent(sutradharClient);
const tutoringAgent = new TutoringAgent(sutradharClient);
const quizAgent = new QuizAgent(sutradharClient);
const codeAgent = new CodeAgent(sutradharClient);
const progressAgent = new ProgressAgent(sutradharClient);
const imageAgent = new ImageAgent(sutradharClient);
const studyPlanAgent = new StudyPlanAgent(sutradharClient);
const notificationAgent = new NotificationAgent(sutradharClient);

// Helper function for async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void | Response>) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// ========== Auth Routes ==========

router.post('/auth/guest', asyncHandler(async (req: Request, res: Response) => {
  const result = await authAgent.createGuest(req.body);
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/auth/magic', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !z.string().email().safeParse(email).success) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  
  const result = await authAgent.sendMagicLink(email, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error }),
    message: result.success ? 'Magic link sent' : undefined
  });
}));

router.post('/auth/verify', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token required' });
  }
  
  const result = await authAgent.verifyToken(token, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 400).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Catalog Routes ==========

router.get('/catalog', asyncHandler(async (req: Request, res: Response) => {
  const result = await courseAgent.listCourses({ requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    courses: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/course/:slug/lessons', asyncHandler(async (req: Request, res: Response) => {
  const result = await courseAgent.listLessons(req.params.slug, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    lessons: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/lesson/:id', asyncHandler(async (req: Request, res: Response) => {
  const courseSlug = req.query.courseSlug as string;
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'courseSlug query parameter required' });
  }
  
  const result = await courseAgent.getLesson(courseSlug, req.params.id, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Tutoring Routes ==========

router.post('/lesson/:id/query', asyncHandler(async (req: Request, res: Response) => {
  const { query, url } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ ok: false, error: 'Query required' });
  }
  
  const courseSlug = req.query.courseSlug as string || '';
  const lessonId = req.params.id;
  const sessionId = String(req.query.sessionId || req.body.sessionId || 'lesson-session');
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'Course slug required' });
  }
  
  // Get lesson content for context
  const lessonResult = await courseAgent.getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] as string });
  
  if (!lessonResult.success || !lessonResult.data) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = lessonResult.data;
  const lessonTitle = lesson.title || '';
  const lessonUrl = url || `http://localhost:3000/lesson/${lessonId}?courseSlug=${courseSlug}`;
  
  // Use Sutradhar LLM agent to detect intent
  const intentPrompt = `Analyze the following user query and determine the intent. The user is viewing a lesson titled "${lessonTitle}".

Query: "${query}"

Possible intents:
1. "question" - Regular question about the lesson content
2. "slack" - User wants to send a Slack message with the lesson URL
3. "github" - User wants to create a GitHub issue to expand on the lesson
4. "calendar" - User wants to set a calendar reminder to study this lesson
5. "summary" - User wants a summary of the lesson

Respond ONLY with a JSON object in this exact format:
{
  "intent": "question|slack|github|calendar|summary",
  "parameters": {}
}`;

  const intentResult = await sutradharClient.executeTask('llm-agent', {
    id: `intent-${Date.now()}`,
    type: 'chat',
    payload: {
      system: 'You are an intent classifier. Respond only with valid JSON.',
      user: intentPrompt,
      provider: 'openai',
      model: 'gpt-4o-mini'
    },
    context: { requestId: req.headers['x-request-id'] as string }
  });
  
  if (!intentResult.success || !intentResult.data) {
    return res.status(500).json({ ok: false, error: 'Failed to process intent' });
  }
  
  let intentData: any;
  try {
    const text = intentResult.data.text?.trim() || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    intentData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    intentData = { intent: 'question', parameters: {} };
  }
  
  const intent = intentData.intent || 'question';
  
  // Handle different intents via Sutradhar action agent
  switch (intent) {
    case 'slack': {
      const result = await sutradharClient.executeTask('action-agent', {
        id: `slack-${Date.now()}`,
        type: 'execute',
        payload: {
          actionType: 'slack',
          payload: {
            text: `📚 Check out this lesson: ${lessonTitle}\n${lessonUrl}`,
            sessionId
          }
        },
        context: { requestId: req.headers['x-request-id'] as string }
      });
      
      return res.json({
        ok: result.success,
        action: 'slack',
        message: 'Message sent to Slack!',
        data: result.success && result.data ? result.data : undefined
      });
    }
    
    case 'github': {
      const title = `Expand on lesson: ${lessonTitle}`;
      const body = `I'd like to expand on the lesson "${lessonTitle}".\n\nLesson URL: ${lessonUrl}\n\nAdditional context:\n${lesson.body?.substring(0, 500) || ''}`;
      
      const result = await sutradharClient.executeTask('action-agent', {
        id: `github-${Date.now()}`,
        type: 'execute',
        payload: {
          actionType: 'github',
          payload: {
            title,
            body,
            sessionId
          }
        },
        context: { requestId: req.headers['x-request-id'] as string }
      });
      
      const resultData = result.success && result.data ? (result.data as any) : {};
      const issueUrl = resultData.html_url || resultData.htmlLink || '';
      
      return res.json({
        ok: result.success,
        action: 'github',
        message: issueUrl ? `GitHub issue created! ${issueUrl}` : 'GitHub issue created!',
        data: result.success && result.data ? result.data : undefined
      });
    }
    
    case 'calendar': {
      const timeStr = intentData.parameters?.time || '1 hour';
      let hours = 1;
      const hourMatch = timeStr.match(/(\d+)\s*hour/i);
      if (hourMatch) {
        hours = parseInt(hourMatch[1], 10);
      }
      
      const startTime = new Date(Date.now() + hours * 3600000);
      const endTime = new Date(startTime.getTime() + 3600000);
      
      const result = await sutradharClient.executeTask('action-agent', {
        id: `calendar-${Date.now()}`,
        type: 'execute',
        payload: {
          actionType: 'calendar',
          payload: {
            title: `Study: ${lessonTitle}`,
            description: `Reminder to study "${lessonTitle}"\n\nLesson URL: ${lessonUrl}`,
            startISO: startTime.toISOString(),
            endISO: endTime.toISOString(),
            sessionId
          }
        },
        context: { requestId: req.headers['x-request-id'] as string }
      });
      
      const resultData = result.success && result.data ? (result.data as any) : {};
      const htmlLink = resultData.htmlLink || resultData.html_link || '';
      const eventId = resultData.id || resultData.event_id || '';
      
      return res.json({
        ok: result.success,
        action: 'calendar',
        message: htmlLink 
          ? `Calendar reminder set for ${hours} hour(s) from now! View event: ${htmlLink}`
          : `Calendar reminder set for ${hours} hour(s) from now!`,
        data: result.success && result.data ? {
          id: eventId,
          htmlLink,
          ...resultData
        } : undefined
      });
    }
    
    case 'summary': {
      const excerpt = (lesson.body || '').substring(0, 2000);
      
      const summaryResult = await sutradharClient.executeTask('llm-agent', {
        id: `summary-${Date.now()}`,
        type: 'chat',
        payload: {
          system: `You are a helpful educational assistant. Summarize the following lesson content in 2-3 sentences (under 100 words). Focus on key concepts and main takeaways. Make it concise and engaging.`,
          user: `Lesson Title: ${lesson.title}\n\nContent:\n${excerpt}`,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context: { requestId: req.headers['x-request-id'] as string }
      });
      
      if (!summaryResult.success || !summaryResult.data) {
        return res.status(500).json({ ok: false, error: 'Failed to generate summary' });
      }
      
      const summaryData = summaryResult.data as any;
      return res.json({
        ok: true,
        summary: summaryData.text || '',
        lessonTitle: lesson.title
      });
    }
    
    default: {
      // Regular question - use tutoring agent
      const result = await tutoringAgent.answer(query, { 
        requestId: req.headers['x-request-id'] as string,
        sessionId,
        courseSlug,
        lessonId
      });
      
      res.status(result.success ? 200 : 500).json({
        ok: result.success,
        ...(result.success ? result.data : { error: result.error })
      });
    }
  }
}));

router.post('/lesson/:id/summarize', asyncHandler(async (req: Request, res: Response) => {
  const courseSlug = req.query.courseSlug as string;
  const lessonId = req.params.id;
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'courseSlug query parameter required' });
  }
  
  const lessonResult = await courseAgent.getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] as string });
  
  if (!lessonResult.success || !lessonResult.data) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = lessonResult.data;
  const excerpt = (lesson.body || '').substring(0, 2000);
  
  const summaryResult = await sutradharClient.executeTask('llm-agent', {
    id: `summary-${Date.now()}`,
    type: 'chat',
    payload: {
      system: `You are a helpful educational assistant. Summarize the following lesson content in 2-3 sentences (under 100 words). Focus on key concepts and main takeaways. Make it concise and engaging.`,
      user: `Lesson Title: ${lesson.title}\n\nContent:\n${excerpt}`,
      provider: 'openai',
      model: 'gpt-4o-mini'
    },
    context: { requestId: req.headers['x-request-id'] as string }
  });
  
  if (!summaryResult.success || !summaryResult.data) {
    return res.status(500).json({ ok: false, error: 'Failed to generate summary' });
  }
  
  const summaryData = summaryResult.data as any;
  res.json({
    ok: true,
    summary: summaryData.text || '',
    lessonTitle: lesson.title
  });
}));

router.post('/lesson/:id/answer', asyncHandler(async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ ok: false, error: 'Question required' });
  }
  
  const result = await tutoringAgent.answer(question, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Quiz Routes ==========

router.get('/quiz/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await quizAgent.getQuiz(req.params.id, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/quiz/:id/attempt', asyncHandler(async (req: Request, res: Response) => {
  const result = await quizAgent.submitAttempt(req.body, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Code Assignment Routes ==========

router.get('/code', asyncHandler(async (req: Request, res: Response) => {
  const courseSlug = req.query.courseSlug as string;
  
  // Use Sutradhar data-agent via codeAgent (or directly)
  try {
    const result = await sutradharClient.executeTask('data-agent', {
      id: `query-${Date.now()}`,
      type: 'query',
      payload: {
        path: 'codeAssignments:list',
        args: { courseSlug: courseSlug || undefined }
      },
      context: { requestId: req.headers['x-request-id'] as string }
    });
    
    const assignments = result.success && result.data ? result.data : [];
    
    res.json({
      ok: true,
      assignments: assignments || []
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to list assignments',
      assignments: []
    });
  }
}));

router.get('/code/:assignmentId', asyncHandler(async (req: Request, res: Response) => {
  const result = await codeAgent.getAssignment(req.params.assignmentId, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/:assignmentId/hint', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const assignmentId = req.params.assignmentId;
  
  // Get assignment first
  const assignmentResult = await codeAgent.getAssignment(assignmentId);
  if (!assignmentResult.success) {
    return res.status(404).json({ ok: false, error: 'Assignment not found' });
  }
  
  const result = await tutoringAgent.getHint(
    assignmentResult.data?.prompt || '',
    code || '',
    undefined,
    { requestId: req.headers['x-request-id'] as string }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/:assignmentId/run', asyncHandler(async (req: Request, res: Response) => {
  const result = await codeAgent.runCode(req.body, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Image Routes ==========

router.get('/course/:slug/images', asyncHandler(async (req: Request, res: Response) => {
  const result = await imageAgent.getCourseImages(req.params.slug, undefined, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    images: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

// ========== Progress Routes ==========

router.get('/progress', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId query parameter required' });
  }
  
  const result = await progressAgent.getProgress(userId, { requestId: req.headers['x-request-id'] as string });
  
  if (!result.success) {
    return res.status(500).json({ ok: false, error: result.error });
  }
  
  const resultData = result.data ? (result.data as any) : {};
  res.json({
    ok: true,
    user: { streak: resultData.streak || 0, badges: resultData.badges || [] },
    quizAttempts: [],
    events: resultData.recentEvents || [],
    streak: resultData.streak || 0,
    badges: resultData.badges || []
  });
}));

// ========== Study Plan Routes ==========

router.post('/schedule/study', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug } = req.body;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await studyPlanAgent.createPlan(userId, courseSlug, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Assistant Routes ==========

router.post('/assistant/answer', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, question } = req.body;
  if (!sessionId || !question) {
    return res.status(400).json({ ok: false, error: 'sessionId and question required' });
  }
  
  const result = await tutoringAgent.answer(question, {
    sessionId,
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/escalate', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, reason, email } = req.body;
  if (!sessionId || !reason) {
    return res.status(400).json({ ok: false, error: 'sessionId and reason required' });
  }
  
  const result = await tutoringAgent.escalate(
    reason,
    email,
    { sessionId, requestId: req.headers['x-request-id'] as string }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/forum', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, text, url } = req.body;
  if (!sessionId || !text) {
    return res.status(400).json({ ok: false, error: 'sessionId and text required' });
  }
  
  const result = await notificationAgent.postToForum(
    text,
    url,
    { sessionId, requestId: req.headers['x-request-id'] as string }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assistant/actions/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { text, channelId, sessionId } = req.body;
  
  if (type === 'slack') {
    if (!text) {
      return res.status(400).json({ ok: false, error: 'text required for Slack action' });
    }
    
    const result = await notificationAgent.sendSlackMessage(
      text,
      channelId,
      { sessionId, requestId: req.headers['x-request-id'] as string }
    );
    
    res.status(result.success ? 200 : 500).json({
      ok: result.success,
      ...(result.success ? result.data : { error: result.error })
    });
  } else {
    res.status(400).json({ ok: false, error: `Action type '${type}' not implemented` });
  }
}));

// ========== LiveKit Routes ==========

router.get('/room/:id/join', asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'anonymous');
  const roomId = req.params.id;
  
  // TODO: Use Sutradhar voice agent to get LiveKit token
  // For now, return a placeholder response
  // In production, this should call Sutradhar's voice agent
  const result = await sutradharClient.executeTask('voice-agent', {
    id: `voice-${Date.now()}`,
    type: 'token',
    payload: {
      roomId,
      userId
    },
    context: { requestId: req.headers['x-request-id'] as string }
  }).catch(() => ({ success: false, error: 'Voice agent not available' }));
  
  if (!result.success) {
    // Fallback: generate a simple agenda
    let agenda = 'Continue your learning journey!';
    
    try {
      const progressResult = await progressAgent.getProgress(userId);
      if (progressResult.success && progressResult.data) {
        agenda = `Keep up the great work!`;
      }
    } catch (error) {
      // Non-fatal
    }
    
    return res.json({
      ok: true,
      token: '',
      agenda
    });
  }
  
  // Type guard to check if result has data property
  const resultData = (result.success && 'data' in result && result.data) ? (result.data as any) : {};
  res.json({
    ok: true,
    token: resultData.token || '',
    agenda: resultData.agenda || 'Continue your learning journey!'
  });
}));

// ========== Admin Routes ==========

router.post('/admin/seed/index', asyncHandler(async (req: Request, res: Response) => {
  // Use Sutradhar retrieval agent to index documents
  const result = await sutradharClient.executeTask('retrieval-agent', {
    id: `index-${Date.now()}`,
    type: 'index',
    payload: {
      content: {
        id: 'seed_index',
        text: 'Index rebuild triggered',
        source: 'admin'
      }
    },
    context: { requestId: req.headers['x-request-id'] as string }
  });
  
  res.json({
    ok: result.success,
    message: 'Index rebuild triggered',
    indexStatus: result.success
  });
}));

router.post('/admin/images/cache', asyncHandler(async (req: Request, res: Response) => {
  const result = await imageAgent.cacheAllImages({ requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Agent Info Routes ==========

router.get('/agents', asyncHandler(async (req: Request, res: Response) => {
  // List all Optimus agents
  const agents = [
    authAgent.getInfo(),
    courseAgent.getInfo(),
    tutoringAgent.getInfo(),
    quizAgent.getInfo(),
    codeAgent.getInfo(),
    progressAgent.getInfo(),
    imageAgent.getInfo(),
    studyPlanAgent.getInfo(),
    notificationAgent.getInfo()
  ];
  
  res.json({
    ok: true,
    agents
  });
}));

export { router as edtechRoutes };

