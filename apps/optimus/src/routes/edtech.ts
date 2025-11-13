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
import { AdaptiveLearningAgent } from '../agents/adaptive-learning-agent';
import { AnalyticsAgent } from '../agents/analytics-agent';
import { GamificationAgent } from '../agents/gamification-agent';
import { ContentGenerationAgent } from '../agents/content-generation-agent';
import { SocialAgent } from '../agents/social-agent';
import { AssessmentAgent } from '../agents/assessment-agent';

const router = Router();

// Initialize Sutradhar client
const sutradharClient = new SutradharClient('http://localhost:3999'); // Hardcoded Sutradhar URL

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
const adaptiveLearningAgent = new AdaptiveLearningAgent(sutradharClient);
const analyticsAgent = new AnalyticsAgent(sutradharClient);
const gamificationAgent = new GamificationAgent(sutradharClient);
const contentGenerationAgent = new ContentGenerationAgent(sutradharClient);
const socialAgent = new SocialAgent(sutradharClient);
const assessmentAgent = new AssessmentAgent(sutradharClient);

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
  // Decode course slug (handle URL encoding)
  const courseSlug = decodeURIComponent(req.params.slug);
  const result = await courseAgent.listLessons(courseSlug, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : (result.error?.includes('not found') ? 404 : 500)).json({
    ok: result.success,
    lessons: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/lesson/:id', asyncHandler(async (req: Request, res: Response) => {
  // Decode both courseSlug and lessonId (handle URL encoding)
  const courseSlug = decodeURIComponent((req.query.courseSlug as string) || '');
  const lessonId = decodeURIComponent(req.params.id);
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'courseSlug query parameter required' });
  }
  
  const result = await courseAgent.getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] as string });
  res.status(result.success ? 200 : (result.error?.includes('not found') ? 404 : 500)).json({
    ok: result.success,
    ...(result.success ? { lesson: result.data } : { error: result.error })
  });
}));

// ========== Tutoring Routes ==========

router.post('/lesson/:id/query', asyncHandler(async (req: Request, res: Response) => {
  const { query, url } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ ok: false, error: 'Query required' });
  }
  
  const courseSlug = decodeURIComponent((req.query.courseSlug as string) || '');
  const lessonId = decodeURIComponent(req.params.id);
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
  const lessonUrl = url || `http://localhost:3777/lesson/${lessonId}?courseSlug=${courseSlug}`; // Hardcoded Masterbolt URL
  
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
  const courseSlug = decodeURIComponent((req.query.courseSlug as string) || '');
  const lessonId = decodeURIComponent(req.params.id);
  
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
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ ok: false, error: 'Question required' });
  }
  
  // Decode lesson ID and courseSlug if provided
  const lessonId = decodeURIComponent(req.params.id);
  const courseSlug = req.query.courseSlug ? decodeURIComponent(req.query.courseSlug as string) : undefined;
  
  const result = await tutoringAgent.answer(question, { 
    requestId: req.headers['x-request-id'] as string,
    lessonId,
    courseSlug
  });
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
    notificationAgent.getInfo(),
    adaptiveLearningAgent.getInfo(),
    analyticsAgent.getInfo(),
    gamificationAgent.getInfo(),
    contentGenerationAgent.getInfo(),
    socialAgent.getInfo(),
    assessmentAgent.getInfo()
  ];
  
  res.json({
    ok: true,
    agents
  });
}));

// ========== Adaptive Learning Routes ==========

router.post('/learning/path', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug } = req.body;
  if (!userId || !courseSlug) {
    return res.status(400).json({ ok: false, error: 'userId and courseSlug required' });
  }
  
  const result = await adaptiveLearningAgent.createLearningPath(userId, courseSlug, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/learning/recommendations', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const limit = parseInt(req.query.limit as string) || 5;
  
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await adaptiveLearningAgent.getRecommendations(userId, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    recommendations: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.put('/learning/preferences', asyncHandler(async (req: Request, res: Response) => {
  const { userId, ...preferences } = req.body;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await adaptiveLearningAgent.updatePreferences(userId, preferences, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/learning/adjust-difficulty', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug, performance } = req.body;
  if (!userId || !courseSlug || performance === undefined) {
    return res.status(400).json({ ok: false, error: 'userId, courseSlug, and performance required' });
  }
  
  const result = await adaptiveLearningAgent.adjustDifficulty(userId, courseSlug, performance, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/learning/detect-style', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await adaptiveLearningAgent.detectLearningStyle(userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Analytics Routes ==========

router.get('/analytics', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await analyticsAgent.getAnalytics(userId, startDate, endDate, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    analytics: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/analytics/session', asyncHandler(async (req: Request, res: Response) => {
  const { userId, activityType, itemsCompleted } = req.body;
  if (!userId || !activityType) {
    return res.status(400).json({ ok: false, error: 'userId and activityType required' });
  }
  
  const result = await analyticsAgent.trackSession(userId, activityType, itemsCompleted || [], {
    requestId: req.headers['x-request-id'] as string,
    sessionStartTime: req.body.sessionStartTime || Date.now()
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/analytics/predict-completion', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const courseSlug = req.query.courseSlug as string;
  
  if (!userId || !courseSlug) {
    return res.status(400).json({ ok: false, error: 'userId and courseSlug required' });
  }
  
  const result = await analyticsAgent.predictCompletion(userId, courseSlug, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/analytics/at-risk', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const courseSlug = req.query.courseSlug as string;
  
  if (!userId || !courseSlug) {
    return res.status(400).json({ ok: false, error: 'userId and courseSlug required' });
  }
  
  const result = await analyticsAgent.detectAtRisk(userId, courseSlug, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/analytics/optimal-times', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await analyticsAgent.getOptimalLearningTimes(userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/analytics/report', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const period = (req.query.period as 'week' | 'month') || 'week';
  
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await analyticsAgent.generateReport(userId, period, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Gamification Routes ==========

router.get('/gamification/achievements', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await gamificationAgent.getUserAchievements(userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    achievements: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/gamification/award-badge', asyncHandler(async (req: Request, res: Response) => {
  const { userId, badgeId } = req.body;
  if (!userId || !badgeId) {
    return res.status(400).json({ ok: false, error: 'userId and badgeId required' });
  }
  
  const result = await gamificationAgent.awardBadge(userId, badgeId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/gamification/check-badges', asyncHandler(async (req: Request, res: Response) => {
  const { userId, eventType, eventData } = req.body;
  if (!userId || !eventType) {
    return res.status(400).json({ ok: false, error: 'userId and eventType required' });
  }
  
  const result = await gamificationAgent.checkAndAwardBadges(userId, eventType, eventData || {}, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    badges: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/gamification/points', asyncHandler(async (req: Request, res: Response) => {
  const { userId, amount, source } = req.body;
  if (!userId || !amount || !source) {
    return res.status(400).json({ ok: false, error: 'userId, amount, and source required' });
  }
  
  const result = await gamificationAgent.addPoints(userId, amount, source, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/gamification/points', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const totalPoints = await gamificationAgent.getTotalPoints(userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.json({
    ok: true,
    totalPoints
  });
}));

router.get('/gamification/leaderboard', asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as 'global' | 'course' | 'weekly' | 'monthly') || 'global';
  const courseSlug = req.query.courseSlug as string;
  const limit = parseInt(req.query.limit as string) || 100;
  
  const result = await gamificationAgent.getLeaderboard(type, courseSlug, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    leaderboard: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/gamification/rank', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const type = (req.query.type as 'global' | 'course' | 'weekly' | 'monthly') || 'global';
  const courseSlug = req.query.courseSlug as string;
  
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await gamificationAgent.getUserRank(userId, type, courseSlug, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Content Generation Routes ==========

router.post('/content/summary', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId } = req.body;
  if (!courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'courseSlug and lessonId required' });
  }
  
  const result = await contentGenerationAgent.generateSummary(courseSlug, lessonId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/content/quiz', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId, difficulty, numQuestions } = req.body;
  if (!courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'courseSlug and lessonId required' });
  }
  
  const result = await contentGenerationAgent.generateQuiz(
    courseSlug,
    lessonId,
    difficulty || 'intermediate',
    numQuestions || 5,
    {
      requestId: req.headers['x-request-id'] as string
    }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/content/examples', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId, topic, numExamples } = req.body;
  if (!courseSlug || !lessonId || !topic) {
    return res.status(400).json({ ok: false, error: 'courseSlug, lessonId, and topic required' });
  }
  
  const result = await contentGenerationAgent.generateExamples(
    courseSlug,
    lessonId,
    topic,
    numExamples || 3,
    {
      requestId: req.headers['x-request-id'] as string
    }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/content/flashcards', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId, numCards } = req.body;
  if (!courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'courseSlug and lessonId required' });
  }
  
  const result = await contentGenerationAgent.generateFlashcards(
    courseSlug,
    lessonId,
    numCards || 10,
    {
      requestId: req.headers['x-request-id'] as string
    }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/content/notes', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId } = req.body;
  if (!courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'courseSlug and lessonId required' });
  }
  
  const result = await contentGenerationAgent.generateNotes(courseSlug, lessonId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/content/practice-problems', asyncHandler(async (req: Request, res: Response) => {
  const { courseSlug, lessonId, difficulty, numProblems } = req.body;
  if (!courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'courseSlug and lessonId required' });
  }
  
  const result = await contentGenerationAgent.generatePracticeProblems(
    courseSlug,
    lessonId,
    difficulty || 'intermediate',
    numProblems || 5,
    {
      requestId: req.headers['x-request-id'] as string
    }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Social Routes ==========

router.post('/social/study-group', asyncHandler(async (req: Request, res: Response) => {
  const { name, courseSlug, description, createdBy, isPublic } = req.body;
  if (!name || !courseSlug || !createdBy) {
    return res.status(400).json({ ok: false, error: 'name, courseSlug, and createdBy required' });
  }
  
  const result = await socialAgent.createStudyGroup(name, courseSlug, description || '', createdBy, isPublic !== false, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/social/study-group/:groupId/join', asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'userId required' });
  }
  
  const result = await socialAgent.joinStudyGroup(groupId, userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/social/study-groups', asyncHandler(async (req: Request, res: Response) => {
  const courseSlug = req.query.courseSlug as string;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'courseSlug required' });
  }
  
  const result = await socialAgent.getStudyGroups(courseSlug, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    groups: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/social/forum/post', asyncHandler(async (req: Request, res: Response) => {
  const { userId, lessonId, courseSlug, title, content, tags } = req.body;
  if (!userId || !lessonId || !courseSlug || !title || !content) {
    return res.status(400).json({ ok: false, error: 'userId, lessonId, courseSlug, title, and content required' });
  }
  
  const result = await socialAgent.createPost(userId, lessonId, courseSlug, title, content, tags || [], {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/social/forum/posts', asyncHandler(async (req: Request, res: Response) => {
  const lessonId = req.query.lessonId as string;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!lessonId) {
    return res.status(400).json({ ok: false, error: 'lessonId required' });
  }
  
  const result = await socialAgent.getPosts(lessonId, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    posts: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/social/forum/reply', asyncHandler(async (req: Request, res: Response) => {
  const { postId, userId, content } = req.body;
  if (!postId || !userId || !content) {
    return res.status(400).json({ ok: false, error: 'postId, userId, and content required' });
  }
  
  const result = await socialAgent.replyToPost(postId, userId, content, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/social/forum/replies', asyncHandler(async (req: Request, res: Response) => {
  const postId = req.query.postId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  
  if (!postId) {
    return res.status(400).json({ ok: false, error: 'postId required' });
  }
  
  const result = await socialAgent.getReplies(postId, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    replies: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.post('/social/forum/upvote', asyncHandler(async (req: Request, res: Response) => {
  const { itemType, itemId, userId } = req.body;
  if (!itemType || !itemId || !userId) {
    return res.status(400).json({ ok: false, error: 'itemType, itemId, and userId required' });
  }
  
  const result = await socialAgent.upvote(itemType, itemId, userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/social/forum/accept-answer', asyncHandler(async (req: Request, res: Response) => {
  const { postId, replyId, userId } = req.body;
  if (!postId || !replyId || !userId) {
    return res.status(400).json({ ok: false, error: 'postId, replyId, and userId required' });
  }
  
  const result = await socialAgent.acceptAnswer(postId, replyId, userId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/social/live-session', asyncHandler(async (req: Request, res: Response) => {
  const { title, hostId, courseSlug, type, scheduledAt } = req.body;
  if (!title || !hostId || !courseSlug || !type) {
    return res.status(400).json({ ok: false, error: 'title, hostId, courseSlug, and type required' });
  }
  
  const result = await socialAgent.createLiveSession(title, hostId, courseSlug, type, scheduledAt, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.get('/social/live-sessions', asyncHandler(async (req: Request, res: Response) => {
  const courseSlug = req.query.courseSlug as string;
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'courseSlug required' });
  }
  
  const result = await socialAgent.getLiveSessions(courseSlug, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    sessions: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

router.get('/social/forum/search', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.query as string;
  const courseSlug = req.query.courseSlug as string;
  const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!query) {
    return res.status(400).json({ ok: false, error: 'query required' });
  }
  
  const result = await socialAgent.searchPosts(query, courseSlug, tags, limit, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    posts: result.success ? result.data : [],
    error: result.success ? undefined : result.error
  });
}));

// ========== Assessment Routes ==========

router.post('/assessment/adaptive-quiz', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug, lessonId } = req.body;
  if (!userId || !courseSlug || !lessonId) {
    return res.status(400).json({ ok: false, error: 'userId, courseSlug, and lessonId required' });
  }
  
  const result = await assessmentAgent.generateAdaptiveQuiz(userId, courseSlug, lessonId, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assessment/code-review', asyncHandler(async (req: Request, res: Response) => {
  const { submissionId, code, assignmentPrompt } = req.body;
  if (!submissionId || !code || !assignmentPrompt) {
    return res.status(400).json({ ok: false, error: 'submissionId, code, and assignmentPrompt required' });
  }
  
  const result = await assessmentAgent.reviewCode(submissionId, code, assignmentPrompt, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assessment/quiz-feedback', asyncHandler(async (req: Request, res: Response) => {
  const { userId, quizId, answers } = req.body;
  if (!userId || !quizId || !answers) {
    return res.status(400).json({ ok: false, error: 'userId, quizId, and answers required' });
  }
  
  const result = await assessmentAgent.generateQuizFeedback(userId, quizId, answers, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assessment/assess-skill', asyncHandler(async (req: Request, res: Response) => {
  const { userId, skillName } = req.body;
  if (!userId || !skillName) {
    return res.status(400).json({ ok: false, error: 'userId and skillName required' });
  }
  
  const result = await assessmentAgent.assessSkill(userId, skillName, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/assessment/practice-questions', asyncHandler(async (req: Request, res: Response) => {
  const { userId, courseSlug, weakTopics, numQuestions } = req.body;
  if (!userId || !courseSlug || !weakTopics || !Array.isArray(weakTopics)) {
    return res.status(400).json({ ok: false, error: 'userId, courseSlug, and weakTopics array required' });
  }
  
  const result = await assessmentAgent.generatePracticeQuestions(
    userId,
    courseSlug,
    weakTopics,
    numQuestions || 5,
    {
      requestId: req.headers['x-request-id'] as string
    }
  );
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

// ========== Enhanced Code Routes ==========

router.post('/code/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { code, assignmentPrompt } = req.body;
  if (!code || !assignmentPrompt) {
    return res.status(400).json({ ok: false, error: 'code and assignmentPrompt required' });
  }
  
  const result = await tutoringAgent.analyzeCode(code, assignmentPrompt, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/security', asyncHandler(async (req: Request, res: Response) => {
  const { code, language } = req.body;
  if (!code || !language) {
    return res.status(400).json({ ok: false, error: 'code and language required' });
  }
  
  const result = await codeAgent.analyzeSecurity(code, language, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/style', asyncHandler(async (req: Request, res: Response) => {
  const { code, language } = req.body;
  if (!code || !language) {
    return res.status(400).json({ ok: false, error: 'code and language required' });
  }
  
  const result = await codeAgent.checkStyle(code, language, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

router.post('/code/explain', asyncHandler(async (req: Request, res: Response) => {
  const { code, language } = req.body;
  if (!code || !language) {
    return res.status(400).json({ ok: false, error: 'code and language required' });
  }
  
  const result = await codeAgent.explainCode(code, language, {
    requestId: req.headers['x-request-id'] as string
  });
  
  res.status(result.success ? 200 : 500).json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));

export { router as edtechRoutes };

