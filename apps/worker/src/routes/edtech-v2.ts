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
import { llmService } from '../core/services/llm-service';
import { answerService } from '../core/services/answer-service';

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
  
  // Extract course slug from query param (preferred) or try to parse from lesson ID
  const sessionId = String(req.query.sessionId || 'demo-session');
  const courseSlug = req.query.courseSlug as string || '';
  let lessonId = req.params.id;
  
  // If courseSlug not in query, try to extract from lesson ID (format: courseSlug-lessonId)
  if (!courseSlug) {
    const parts = req.params.id.split('-');
    if (parts.length > 1) {
      // Assume last part is lesson ID, rest is course slug
      lessonId = parts[parts.length - 1];
      const extractedSlug = parts.slice(0, -1).join('-');
      // Try to get from agent
      const result = await (agent as any).getLesson(extractedSlug, lessonId, { sessionId, requestId: req.headers['x-request-id'] });
      return res.status(result.success ? 200 : 404).json({
        ok: result.success,
        lesson: result.success ? result.data : undefined,
        error: result.success ? undefined : result.error
      });
    }
    return res.status(400).json({ ok: false, error: 'Course slug required (use ?courseSlug=slug)' });
  }
  
  const result = await (agent as any).getLesson(courseSlug, lessonId, { sessionId, requestId: req.headers['x-request-id'] });
  res.status(result.success ? 200 : 404).json({
    ok: result.success,
    lesson: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error
  });
}));

// ========== Lesson Summary Route ==========

router.post('/lesson/:id/summarize', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
  const courseSlug = req.query.courseSlug as string || '';
  const lessonId = req.params.id;
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'Course slug required' });
  }
  
  // Get lesson content
  const lessonResult = await (agent as any).getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] });
  
  if (!lessonResult.success || !lessonResult.data) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = lessonResult.data;
  const markdownContent = lesson.body || '';
  
  // Extract a shorter excerpt for faster summarization (first 2000 chars)
  const excerpt = markdownContent.substring(0, 2000);
  
  // Use LLM service for quick summary with optimized prompt
  const summaryResult = await llmService.chat({
    system: `You are a helpful educational assistant. Summarize the following lesson content in 2-3 sentences (under 100 words). Focus on key concepts and main takeaways. Make it concise and engaging.`,
    user: `Lesson Title: ${lesson.title}\n\nContent:\n${excerpt}`,
    provider: 'openai',
    model: 'gpt-4o-mini' // Use faster, cheaper model
  });
  
  if (!summaryResult.ok || !summaryResult.data) {
    return res.status(500).json({ 
      ok: false, 
      error: summaryResult.error || 'Failed to generate summary' 
    });
  }
  
  res.json({
    ok: true,
    summary: summaryResult.data.text,
    lessonTitle: lesson.title
  });
}));

// ========== Lesson Answer Route ==========

router.post('/lesson/:id/answer', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ ok: false, error: 'Question required' });
  }
  
  const courseSlug = req.query.courseSlug as string || '';
  const lessonId = req.params.id;
  const sessionId = String(req.query.sessionId || req.body.sessionId || 'lesson-session');
  
  if (!courseSlug) {
    return res.status(400).json({ ok: false, error: 'Course slug required' });
  }
  
  // Get lesson content for context
  const lessonResult = await (agent as any).getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] });
  
  if (!lessonResult.success || !lessonResult.data) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = lessonResult.data;
  const lessonContext = lesson.body?.substring(0, 3000) || ''; // First 3000 chars for context
  
  // Enhance question with lesson context for better retrieval
  const enhancedQuestion = `${question}\n\nContext from lesson "${lesson.title}":\n${lessonContext.substring(0, 500)}`;
  
  // Check relevance first
  const relevancePrompt = `You are a course assistant. A student is currently studying "${lesson.title}" in a ${courseSlug} course.

The student asked: "${question}"

The current lesson content covers:
${lessonContext.substring(0, 1000)}

Determine if this question is relevant to the current course topic (${courseSlug}) and lesson content.

Respond with ONLY a JSON object:
{
  "relevant": true/false,
  "reason": "brief explanation if not relevant"
}`;

  const relevanceResult = await llmService.chat({
    system: 'You are a relevance checker. Respond only with valid JSON.',
    user: relevancePrompt,
    provider: 'openai',
    model: 'gpt-4o-mini'
  });

  let isRelevant = true;
  let relevanceReason = '';

  if (relevanceResult.ok && relevanceResult.data) {
    try {
      const text = relevanceResult.data.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const relevanceData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      isRelevant = relevanceData.relevant !== false;
      relevanceReason = relevanceData.reason || '';
    } catch (e) {
      log.warn('Failed to parse relevance check, assuming relevant', { error: e });
    }
  }

  if (!isRelevant) {
    return res.json({
      ok: true,
      answer: relevanceReason || `I'm sorry, but that question isn't relevant to the current ${courseSlug} course topic. Please ask questions related to "${lesson.title}" or ${courseSlug} in general.`,
      citations: [],
      sessionId: `${sessionId}-${courseSlug}-${lessonId}`
    });
  }

  // Use answer service with lesson-specific session
  const answerResult = await answerService.answerQuestion(
    `${sessionId}-${courseSlug}-${lessonId}`,
    enhancedQuestion,
    'technical' // Use technical persona for lesson questions
  );

  // Paraphrase answer without citations
  let paraphrasedAnswer = answerResult.finalText;
  
  if (answerResult.citations && answerResult.citations.length > 0) {
    const paraphrasePrompt = `You are a helpful educational assistant. The following answer was generated based on course content, but it includes citation markers like "[source]".

Original answer:
${answerResult.finalText}

Please rewrite this answer in a natural, conversational way without any citation markers, brackets, or source references. Just provide the information clearly and naturally as if explaining to a student.

Keep all the important information and maintain the same level of detail. Do not mention sources, citations, or add phrases like "according to" or "based on". Just explain the concepts directly.`;

    try {
      const paraphraseResult = await llmService.chat({
        system: 'You are a helpful educational assistant. Paraphrase answers naturally without citations.',
        user: paraphrasePrompt,
        provider: 'openai',
        model: 'gpt-4o-mini'
      });

      if (paraphraseResult.ok && paraphraseResult.data?.text) {
        paraphrasedAnswer = paraphraseResult.data.text.trim();
        log.info('Answer paraphrased successfully', {
          originalLength: answerResult.finalText.length,
          paraphrasedLength: paraphrasedAnswer.length
        });
      }
    } catch (error: any) {
      log.warn('Failed to paraphrase answer, using original', { error: error.message });
      // Fallback: remove citation markers manually
      paraphrasedAnswer = answerResult.finalText.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
    }
  }
  
  res.json({
    ok: true,
    answer: paraphrasedAnswer,
    citations: [], // Don't return citations to frontend
    sessionId: `${sessionId}-${courseSlug}-${lessonId}`
  });
}));

// ========== Lesson Query Processor Route ==========
// Handles both questions and action requests (Slack, GitHub, Calendar, Summary)

router.post('/lesson/:id/query', rateLimiters.standard, asyncHandler(async (req: Request, res: Response) => {
  const agent = agentRegistry.get('CourseAgent');
  if (!agent) {
    return res.status(500).json({ ok: false, error: 'CourseAgent not available' });
  }
  
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
  const lessonResult = await (agent as any).getLesson(courseSlug, lessonId, { requestId: req.headers['x-request-id'] });
  
  if (!lessonResult.success || !lessonResult.data) {
    return res.status(404).json({ ok: false, error: 'Lesson not found' });
  }
  
  const lesson = lessonResult.data;
  const lessonTitle = lesson.title;
  const lessonUrl = url || `${req.protocol}://${req.get('host')}/lesson/${lessonId}?courseSlug=${courseSlug}`;
  
  // Use LLM to detect intent and extract action parameters
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
  "parameters": {
    // For slack: {}
    // For github: { "title": "...", "body": "..." }
    // For calendar: { "time": "in X hours/minutes" }
    // For question/summary: {}
  }
}`;

  const intentResult = await llmService.chat({
    system: 'You are an intent classifier. Respond only with valid JSON.',
    user: intentPrompt,
    provider: 'openai',
    model: 'gpt-4o-mini'
  });
  
  if (!intentResult.ok || !intentResult.data) {
    return res.status(500).json({ ok: false, error: 'Failed to process intent' });
  }
  
  let intentData: any;
  try {
    const text = intentResult.data.text.trim();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    intentData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    // Fallback: treat as regular question
    intentData = { intent: 'question', parameters: {} };
  }
  
  const intent = intentData.intent || 'question';
  
  // Handle different intents
  switch (intent) {
    case 'slack': {
      const { slackPostMessage } = await import('../integrations/actions/slack');
      const result = await slackPostMessage(`📚 Check out this lesson: ${lessonTitle}\n${lessonUrl}`);
      
      return res.json({
        ok: true,
        action: 'slack',
        message: 'Message sent to Slack!',
        data: result
      });
    }
    
    case 'github': {
      const { createGithubIssue } = await import('../integrations/actions/github');
      const title = intentData.parameters?.title || `Expand on lesson: ${lessonTitle}`;
      const body = intentData.parameters?.body || 
        `I'd like to expand on the lesson "${lessonTitle}".\n\nLesson URL: ${lessonUrl}\n\nAdditional context:\n${lesson.body?.substring(0, 500) || ''}`;
      
      const result = await createGithubIssue(title, body);
      const issueUrl = (result as any)?.data?.html_url || (result as any)?.html_url || '';
      
      return res.json({
        ok: true,
        action: 'github',
        message: issueUrl ? `GitHub issue created! ${issueUrl}` : 'GitHub issue created!',
        data: result
      });
    }
    
    case 'calendar': {
      const { createCalendarEvent } = await import('../integrations/actions/calendar');
      const timeStr = intentData.parameters?.time || '1 hour';
      
      // Parse time (simple: "X hour(s)" or "X minute(s)")
      let hours = 1;
      const hourMatch = timeStr.match(/(\d+)\s*hour/i);
      const minuteMatch = timeStr.match(/(\d+)\s*minute/i);
      
      if (hourMatch) {
        hours = parseInt(hourMatch[1]);
      } else if (minuteMatch) {
        hours = parseInt(minuteMatch[1]) / 60;
      }
      
      const now = new Date();
      const reminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      const startISO = reminderTime.toISOString();
      const endISO = new Date(reminderTime.getTime() + 30 * 60 * 1000).toISOString(); // 30 min event
      
      let calendarResult: any;
      try {
        calendarResult = await createCalendarEvent(
          `Study: ${lessonTitle}`,
          startISO,
          endISO,
          `Reminder to study: ${lessonTitle}\n\nLesson URL: ${lessonUrl}`,
          undefined // Use default calendar
        );
        
        // Log full structure for debugging
        log.info('Calendar result from createCalendarEvent', {
          type: typeof calendarResult,
          isNull: calendarResult === null,
          isUndefined: calendarResult === undefined,
          keys: calendarResult ? Object.keys(calendarResult).slice(0, 10) : [],
          hasResponseData: !!(calendarResult as any)?.response_data,
          hasData: !!(calendarResult as any)?.data,
          jsonPreview: JSON.stringify(calendarResult).substring(0, 500)
        });
      } catch (error: any) {
        log.error('Failed to create calendar event', { error: error.message, stack: error.stack });
        return res.status(500).json({
          ok: false,
          error: `Failed to create calendar event: ${error.message}`
        });
      }
      
      // Extract event details - try multiple possible structures
      let eventData: any = {};
      let htmlLink = '';
      let eventId = '';
      
      // Method 1: Direct response_data (most common)
      if ((calendarResult as any)?.response_data) {
        eventData = (calendarResult as any).response_data;
        htmlLink = eventData.htmlLink || '';
        eventId = eventData.id || '';
      }
      // Method 2: Nested data.response_data
      else if ((calendarResult as any)?.data?.response_data) {
        eventData = (calendarResult as any).data.response_data;
        htmlLink = eventData.htmlLink || '';
        eventId = eventData.id || '';
      }
      // Method 3: Direct properties
      else if ((calendarResult as any)?.htmlLink || (calendarResult as any)?.id) {
        eventData = calendarResult;
        htmlLink = (calendarResult as any).htmlLink || (calendarResult as any).html_link || '';
        eventId = (calendarResult as any).id || (calendarResult as any).event_id || '';
      }
      
      // Method 4: Deep JSON search as fallback
      if ((!htmlLink || !eventId) && calendarResult) {
        const jsonStr = JSON.stringify(calendarResult);
        const htmlLinkMatches = jsonStr.match(/"htmlLink"\s*:\s*"([^"]+)"/g);
        const idMatches = jsonStr.match(/"id"\s*:\s*"([a-zA-Z0-9_-]{20,})"/g); // Event IDs are usually longer
        
        if (htmlLinkMatches && htmlLinkMatches.length > 0 && !htmlLink) {
          const match = htmlLinkMatches[0].match(/"htmlLink"\s*:\s*"([^"]+)"/);
          if (match) htmlLink = match[1];
        }
        
        if (idMatches && idMatches.length > 0 && !eventId) {
          // Filter out email-like IDs and get the event ID (usually longer alphanumeric)
          const candidateIds = idMatches
            .map(m => m.match(/"id"\s*:\s*"([^"]+)"/)?.[1])
            .filter((id): id is string => !!id && id.length > 10 && !id.includes('@') && !id.includes('google.com'));
          if (candidateIds.length > 0) {
            eventId = candidateIds[0]; // Take the first valid-looking event ID
          }
        }
      }
      
      if (calendarResult && !eventData) {
        eventData = calendarResult;
      }
      
      const message = htmlLink 
        ? `Calendar reminder set for ${hours} hour(s) from now! View event: ${htmlLink}`
        : `Calendar reminder set for ${hours} hour(s) from now!`;
      
      log.info('Calendar event created via voice assistant', {
        eventId: eventId || 'not found',
        htmlLink: htmlLink ? 'present' : 'missing',
        hours
      });
      
      return res.json({
        ok: true,
        action: 'calendar',
        message,
        data: {
          id: eventId,
          htmlLink,
          ...(eventData && typeof eventData === 'object' ? eventData : {})
        }
      });
    }
    
    case 'summary': {
      const markdownContent = lesson.body || '';
      const excerpt = markdownContent.substring(0, 2000);
      
      const summaryResult = await llmService.chat({
        system: `You are a helpful educational assistant. Summarize the following lesson content in 2-3 sentences (under 100 words). Focus on key concepts and main takeaways. Make it concise and engaging.`,
        user: `Lesson Title: ${lesson.title}\n\nContent:\n${excerpt}`,
        provider: 'openai',
        model: 'gpt-4o-mini'
      });
      
      if (!summaryResult.ok || !summaryResult.data) {
        return res.status(500).json({ ok: false, error: 'Failed to generate summary' });
      }
      
      return res.json({
        ok: true,
        summary: summaryResult.data.text,
        lessonTitle: lesson.title
      });
    }
    
    default: {
      // Regular question - check relevance first, then answer
      const lessonContext = lesson.body?.substring(0, 3000) || '';
      
      // Check if question is relevant to the current course/topic
      const relevancePrompt = `You are a course assistant. A student is currently studying "${lesson.title}" in a ${courseSlug} course.

The student asked: "${query}"

The current lesson content covers:
${lessonContext.substring(0, 1000)}

Determine if this question is relevant to the current course topic (${courseSlug}) and lesson content.

Respond with ONLY a JSON object:
{
  "relevant": true/false,
  "reason": "brief explanation if not relevant"
}

If the question is about a completely different topic (e.g., asking about Java while studying C++, or asking about cooking while studying programming), mark it as not relevant.`;

      const relevanceResult = await llmService.chat({
        system: 'You are a relevance checker. Respond only with valid JSON.',
        user: relevancePrompt,
        provider: 'openai',
        model: 'gpt-4o-mini'
      });

      let isRelevant = true;
      let relevanceReason = '';

      if (relevanceResult.ok && relevanceResult.data) {
        try {
          const text = relevanceResult.data.text.trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const relevanceData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
          isRelevant = relevanceData.relevant !== false;
          relevanceReason = relevanceData.reason || '';
        } catch (e) {
          log.warn('Failed to parse relevance check, assuming relevant', { error: e });
        }
      }

      if (!isRelevant) {
        return res.json({
          ok: true,
          answer: relevanceReason || `I'm sorry, but that question isn't relevant to the current ${courseSlug} course topic. Please ask questions related to "${lesson.title}" or ${courseSlug} in general.`,
          citations: [],
          sessionId: `${sessionId}-${courseSlug}-${lessonId}`
        });
      }

      // Question is relevant, proceed with answer generation
      const enhancedQuestion = `${query}\n\nContext from lesson "${lesson.title}":\n${lessonContext.substring(0, 500)}`;
      
      const answerResult = await answerService.answerQuestion(
        `${sessionId}-${courseSlug}-${lessonId}`,
        enhancedQuestion,
        'technical'
      );

      // Paraphrase answer without citations using LLM
      let paraphrasedAnswer = answerResult.finalText;
      
      if (answerResult.citations && answerResult.citations.length > 0) {
        // Extract just the answer content without citations
        const paraphrasePrompt = `You are a helpful educational assistant. The following answer was generated based on course content, but it includes citation markers like "[source]".

Original answer:
${answerResult.finalText}

Please rewrite this answer in a natural, conversational way without any citation markers, brackets, or source references. Just provide the information clearly and naturally as if explaining to a student.

Keep all the important information and maintain the same level of detail. Do not mention sources, citations, or add phrases like "according to" or "based on". Just explain the concepts directly.`;

        try {
          const paraphraseResult = await llmService.chat({
            system: 'You are a helpful educational assistant. Paraphrase answers naturally without citations.',
            user: paraphrasePrompt,
            provider: 'openai',
            model: 'gpt-4o-mini'
          });

          if (paraphraseResult.ok && paraphraseResult.data?.text) {
            paraphrasedAnswer = paraphraseResult.data.text.trim();
            log.info('Answer paraphrased successfully', {
              originalLength: answerResult.finalText.length,
              paraphrasedLength: paraphrasedAnswer.length
            });
          }
        } catch (error: any) {
          log.warn('Failed to paraphrase answer, using original', { error: error.message });
          // Fallback: remove citation markers manually
          paraphrasedAnswer = answerResult.finalText.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
        }
      }
      
      return res.json({
        ok: true,
        answer: paraphrasedAnswer,
        citations: [], // Don't return citations to frontend
        sessionId: `${sessionId}-${courseSlug}-${lessonId}`
      });
    }
  }
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
  const indexResult = await fetch(`${req.protocol}://${req.get('host')}/api/unified/knowledge/documents/index`, {
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
  
  const resultData = (await indexResult.json()) as { ok?: boolean };
  
  res.json({
    ok: indexResult.ok && resultData.ok !== false,
    message: 'Index rebuild triggered',
    indexStatus: indexResult.ok && resultData.ok !== false
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

