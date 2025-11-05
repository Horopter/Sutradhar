/**
 * API Client Composable
 * Clean, typed API client for backend endpoints
 */

export interface ApiResponse<T = any> {
  ok: boolean
  error?: string
  [key: string]: any
}

export interface Course {
  slug: string
  title: string
  description: string
  image?: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description?: string
  content?: string
  courseSlug?: string
}

export interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer?: number
}

export interface CodeAssignment {
  id: string
  title: string
  description: string
  prompt: string
  language: string
  starterCode?: string
  tests?: string[]
}

export interface AuthResponse {
  ok: boolean
  sessionId?: string
  userId?: string
  token?: string
  error?: string
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.optimusBaseUrl || 'http://localhost:3888' // Hardcoded Optimus URL
  const get = async <T = any>(path: string): Promise<ApiResponse<T>> => {
    try {
      const response = await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout and retry for SSR
        timeout: 5000,
        retry: process.server ? 0 : 1, // Don't retry on server to avoid blocking
      })
      return response
    } catch (error: any) {
      if (process.dev) {
        console.error(`API GET ${path} failed:`, error.message)
      }
      return {
        ok: false,
        error: error.message || 'Request failed',
      }
    }
  }

  const post = async <T = any>(path: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const response = await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        // Add timeout and retry for SSR
        timeout: 5000,
        retry: process.server ? 0 : 1, // Don't retry on server to avoid blocking
      })
      return response
    } catch (error: any) {
      if (process.dev) {
        console.error(`API POST ${path} failed:`, error.message)
      }
      return {
        ok: false,
        error: error.message || 'Request failed',
      }
    }
  }

  return {
    baseURL,
    get,
    post,
    // Auth endpoints
    auth: {
      guest: () => post<AuthResponse>('/auth/guest', {}),
      magicLink: (email: string) => post<AuthResponse>('/auth/magic', { email }),
      verify: (token: string) => post<AuthResponse>('/auth/verify', { token }),
    },
    // Catalog endpoints
    catalog: {
      list: () => get<{ courses: Course[] }>('/catalog'),
      getLessons: (slug: string) => get<{ lessons: Lesson[] }>(`/course/${slug}/lessons`),
      getLesson: (id: string, sessionId?: string, courseSlug?: string) => {
        const params = new URLSearchParams()
        if (sessionId) params.set('sessionId', sessionId)
        if (courseSlug) params.set('courseSlug', courseSlug)
        const query = params.toString()
        return get<{ lesson: Lesson }>(`/lesson/${id}${query ? '?' + query : ''}`)
      },
      getImages: (slug: string, keywords?: string) => {
        const query = keywords ? `?keywords=${encodeURIComponent(keywords)}` : ''
        return get<{ images: string[] }>(`/course/${slug}/images${query}`)
      },
      summarizeLesson: (lessonId: string, courseSlug: string) => {
        return post<{ summary: string; lessonTitle: string }>(`/lesson/${lessonId}/summarize?courseSlug=${encodeURIComponent(courseSlug)}`, {})
      },
      answerLessonQuestion: (lessonId: string, courseSlug: string, question: string, sessionId?: string) => {
        const params = new URLSearchParams()
        params.set('courseSlug', courseSlug)
        if (sessionId) params.set('sessionId', sessionId)
        return post<{ answer: string; citations: any[] }>(`/lesson/${lessonId}/answer?${params.toString()}`, { question })
      },
      processLessonQuery: (lessonId: string, courseSlug: string, query: string, sessionId?: string, url?: string) => {
        const params = new URLSearchParams()
        params.set('courseSlug', courseSlug)
        if (sessionId) params.set('sessionId', sessionId)
        return post<{ answer?: string; summary?: string; action?: string; message?: string; citations?: any[] }>(`/lesson/${lessonId}/query?${params.toString()}`, { query, url })
      },
    },
    // Quiz endpoints
    quiz: {
      get: (id: string) => get<{ quiz: Quiz }>(`/quiz/${id}`),
      submit: (id: string, userId: string, answers: any[], startedAt: number, finishedAt: number) =>
        post(`/quiz/${id}/attempt`, { userId, answers, startedAt, finishedAt }),
    },
    // Code endpoints
    code: {
      list: (courseSlug?: string) => {
        const query = courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''
        return get<{ assignments: CodeAssignment[] }>(`/code${query}`)
      },
      get: (assignmentId: string) => get<{ assignment: CodeAssignment }>(`/code/${assignmentId}`),
      getHint: (assignmentId: string, code: string, failingTest?: string, sessionId?: string) =>
        post(`/code/${assignmentId}/hint`, { code, failingTest, sessionId }),
      run: (assignmentId: string, code: string, language: string) =>
        post(`/code/${assignmentId}/run`, { code, language }),
    },
    // Assistant endpoints
    assistant: {
      answer: (sessionId: string, question: string) =>
        post('/assistant/answer', { sessionId, question }),
      escalate: (sessionId: string, reason: string, email?: string) =>
        post('/assistant/escalate', { sessionId, reason, email }),
      forum: (sessionId: string, text: string, url?: string) =>
        post('/assistant/forum', { sessionId, text, url }),
    },
    // Progress endpoints
    progress: {
      get: (userId: string) => get(`/progress?userId=${encodeURIComponent(userId)}`),
    },
    // Schedule endpoints
    schedule: {
      createStudyPlan: (userId: string, sessionId: string) =>
        post('/schedule/study', { userId, sessionId }),
    },
    // Adaptive Learning endpoints
    learning: {
      createPath: (userId: string, courseSlug: string) =>
        post('/learning/path', { userId, courseSlug }),
      getRecommendations: (userId: string, limit?: number) =>
        get(`/learning/recommendations?userId=${userId}&limit=${limit || 5}`),
      updatePreferences: (userId: string, preferences: any) =>
        post('/learning/preferences', { userId, ...preferences }),
      adjustDifficulty: (userId: string, courseSlug: string, performance: number) =>
        post('/learning/adjust-difficulty', { userId, courseSlug, performance }),
      detectStyle: (userId: string) =>
        post('/learning/detect-style', { userId }),
    },
    // Analytics endpoints
    analytics: {
      get: (userId: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams({ userId })
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        return get(`/analytics?${params.toString()}`)
      },
      trackSession: (userId: string, activityType: string, itemsCompleted: string[], sessionStartTime?: number) =>
        post('/analytics/session', { userId, activityType, itemsCompleted, sessionStartTime }),
      predictCompletion: (userId: string, courseSlug: string) =>
        get(`/analytics/predict-completion?userId=${userId}&courseSlug=${courseSlug}`),
      detectAtRisk: (userId: string, courseSlug: string) =>
        get(`/analytics/at-risk?userId=${userId}&courseSlug=${courseSlug}`),
      getOptimalTimes: (userId: string) =>
        get(`/analytics/optimal-times?userId=${userId}`),
      getReport: (userId: string, period: 'week' | 'month' = 'week') =>
        get(`/analytics/report?userId=${userId}&period=${period}`),
    },
    // Gamification endpoints
    gamification: {
      getAchievements: (userId: string) =>
        get(`/gamification/achievements?userId=${userId}`),
      awardBadge: (userId: string, badgeId: string) =>
        post('/gamification/award-badge', { userId, badgeId }),
      checkBadges: (userId: string, eventType: string, eventData?: any) =>
        post('/gamification/check-badges', { userId, eventType, eventData }),
      addPoints: (userId: string, amount: number, source: string) =>
        post('/gamification/points', { userId, amount, source }),
      getPoints: (userId: string) =>
        get(`/gamification/points?userId=${userId}`),
      getLeaderboard: (type: 'global' | 'course' | 'weekly' | 'monthly', courseSlug?: string, limit?: number) => {
        const params = new URLSearchParams({ type })
        if (courseSlug) params.set('courseSlug', courseSlug)
        if (limit) params.set('limit', String(limit))
        return get(`/gamification/leaderboard?${params.toString()}`)
      },
      getRank: (userId: string, type: 'global' | 'course' | 'weekly' | 'monthly', courseSlug?: string) => {
        const params = new URLSearchParams({ userId, type })
        if (courseSlug) params.set('courseSlug', courseSlug)
        return get(`/gamification/rank?${params.toString()}`)
      },
    },
    // Content Generation endpoints
    content: {
      generateSummary: (courseSlug: string, lessonId: string) =>
        post('/content/summary', { courseSlug, lessonId }),
      generateQuiz: (courseSlug: string, lessonId: string, difficulty?: string, numQuestions?: number) =>
        post('/content/quiz', { courseSlug, lessonId, difficulty, numQuestions }),
      generateExamples: (courseSlug: string, lessonId: string, topic: string, numExamples?: number) =>
        post('/content/examples', { courseSlug, lessonId, topic, numExamples }),
      generateFlashcards: (courseSlug: string, lessonId: string, numCards?: number) =>
        post('/content/flashcards', { courseSlug, lessonId, numCards }),
      generateNotes: (courseSlug: string, lessonId: string) =>
        post('/content/notes', { courseSlug, lessonId }),
      generatePracticeProblems: (courseSlug: string, lessonId: string, difficulty?: string, numProblems?: number) =>
        post('/content/practice-problems', { courseSlug, lessonId, difficulty, numProblems }),
    },
    // Social endpoints
    social: {
      createStudyGroup: (name: string, courseSlug: string, description: string, createdBy: string, isPublic?: boolean) =>
        post('/social/study-group', { name, courseSlug, description, createdBy, isPublic }),
      joinStudyGroup: (groupId: string, userId: string) =>
        post(`/social/study-group/${groupId}/join`, { userId }),
      getStudyGroups: (courseSlug: string, limit?: number) =>
        get(`/social/study-groups?courseSlug=${courseSlug}&limit=${limit || 20}`),
      createPost: (userId: string, lessonId: string, courseSlug: string, title: string, content: string, tags?: string[]) =>
        post('/social/forum/post', { userId, lessonId, courseSlug, title, content, tags }),
      getPosts: (lessonId: string, limit?: number) =>
        get(`/social/forum/posts?lessonId=${lessonId}&limit=${limit || 20}`),
      replyToPost: (postId: string, userId: string, content: string) =>
        post('/social/forum/reply', { postId, userId, content }),
      getReplies: (postId: string, limit?: number) =>
        get(`/social/forum/replies?postId=${postId}&limit=${limit || 50}`),
      upvote: (itemType: 'post' | 'reply', itemId: string, userId: string) =>
        post('/social/forum/upvote', { itemType, itemId, userId }),
      acceptAnswer: (postId: string, replyId: string, userId: string) =>
        post('/social/forum/accept-answer', { postId, replyId, userId }),
      createLiveSession: (title: string, hostId: string, courseSlug: string, type: string, scheduledAt?: number) =>
        post('/social/live-session', { title, hostId, courseSlug, type, scheduledAt }),
      getLiveSessions: (courseSlug: string) =>
        get(`/social/live-sessions?courseSlug=${courseSlug}`),
      searchPosts: (query: string, courseSlug?: string, tags?: string[], limit?: number) => {
        const params = new URLSearchParams({ query })
        if (courseSlug) params.set('courseSlug', courseSlug)
        if (tags) params.set('tags', tags.join(','))
        if (limit) params.set('limit', String(limit))
        return get(`/social/forum/search?${params.toString()}`)
      },
    },
    // Assessment endpoints
    assessment: {
      generateAdaptiveQuiz: (userId: string, courseSlug: string, lessonId: string) =>
        post('/assessment/adaptive-quiz', { userId, courseSlug, lessonId }),
      reviewCode: (submissionId: string, code: string, assignmentPrompt: string) =>
        post('/assessment/code-review', { submissionId, code, assignmentPrompt }),
      getQuizFeedback: (userId: string, quizId: string, answers: Record<string, number>) =>
        post('/assessment/quiz-feedback', { userId, quizId, answers }),
      assessSkill: (userId: string, skillName: string) =>
        post('/assessment/assess-skill', { userId, skillName }),
      generatePracticeQuestions: (userId: string, courseSlug: string, weakTopics: string[], numQuestions?: number) =>
        post('/assessment/practice-questions', { userId, courseSlug, weakTopics, numQuestions }),
    },
    // Enhanced Code endpoints
    codeEnhanced: {
      analyze: (code: string, assignmentPrompt: string) =>
        post('/code/analyze', { code, assignmentPrompt }),
      checkSecurity: (code: string, language: string) =>
        post('/code/security', { code, language }),
      checkStyle: (code: string, language: string) =>
        post('/code/style', { code, language }),
      explain: (code: string, language: string) =>
        post('/code/explain', { code, language }),
    },
  }
}