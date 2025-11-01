# Apex Academy Agents

This directory contains lean, single-purpose agents for the Apex Academy EdTech platform. Each agent follows the Single Responsibility Principle and is designed to do one thing efficiently.

## Architecture

All agents inherit from `BaseAgent` which provides:
- Consistent error handling
- Success/error result patterns
- Context validation
- Metadata support

## Agent Registry

Agents are registered in `index.ts` and can be accessed via:

```typescript
import { agentRegistry } from './agents';

const authAgent = agentRegistry.get('AuthAgent');
const result = await authAgent.createGuest();
```

## Agents

### 1. AuthAgent
**Responsibility:** Handle user authentication
- `createGuest()` - Create guest user session
- `sendMagicLink(email)` - Send magic link email
- `verifyToken(token)` - Verify magic link token

### 2. CourseAgent
**Responsibility:** Manage courses and lessons from data_repository
- `listCourses()` - List all courses (subjects)
- `listLessons(courseSlug)` - List lessons for a course
- `getLesson(courseSlug, lessonId)` - Get specific lesson

### 3. TutoringAgent
**Responsibility:** Provide hints and answers (never full solutions)
- `answer(question)` - Answer general questions
- `getHint(assignmentPrompt, currentCode, failingTest?)` - Get hint for coding assignment
- `escalate(reason, email?)` - Escalate to human support

### 4. QuizAgent
**Responsibility:** Manage quizzes and quiz attempts
- `getQuiz(quizId)` - Get quiz by ID
- `submitAttempt(attempt)` - Submit quiz attempt and calculate score
- `getUserAttempts(userId)` - Get user's quiz attempts

### 5. CodeAgent
**Responsibility:** Handle coding assignments and code execution
- `getAssignment(assignmentId)` - Get coding assignment
- `runCode(request)` - Run code against tests (with sandboxing)
- `saveSubmission(userId, assignmentId, code, results)` - Save code submission

### 6. ProgressAgent
**Responsibility:** Track and report user progress
- `getProgress(userId)` - Get user progress summary
- `updateStreak(userId, increment)` - Update user streak
- `awardBadge(userId, badge)` - Award badge to user
- `logEvent(userId, type, payload)` - Log user event

### 7. ImageAgent
**Responsibility:** Fetch images for courses (Moss bridge + local fallback)
- `getCourseImages(courseSlug, keywords?)` - Get images for a course
- `cacheAllImages()` - Cache images for all courses

### 8. StudyPlanAgent
**Responsibility:** Create spaced repetition study plans and calendar events
- `createPlan(userId, courseSlug?)` - Create 2-week spaced repetition plan
- `getUserSchedules(userId)` - Get user's study schedules

### 9. NotificationAgent
**Responsibility:** Handle forum posts and notifications
- `postToForum(text, url?)` - Post to forum using BrowserUse
- `sendSlackMessage(text, channelId?)` - Send Slack notification

## Usage in Routes

Routes delegate to agents instead of directly calling services:

```typescript
router.post('/auth/guest', asyncHandler(async (req, res) => {
  const agent = agentRegistry.get('AuthAgent');
  const result = await agent.createGuest();
  
  res.json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));
```

## Benefits

1. **Single Responsibility:** Each agent does one thing well
2. **Testability:** Easy to unit test individual agents
3. **Maintainability:** Changes to unified services don't break agents
4. **Composability:** Agents can be composed for complex workflows
5. **Consistency:** Uniform error handling and result patterns

## Future Enhancements

- Add agent-level caching
- Add agent metrics/monitoring
- Add agent dependency injection
- Add agent composition patterns
- Add agent retry logic

