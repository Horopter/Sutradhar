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
  const baseURL = config.public.sutradharBaseUrl || 'http://localhost:2198'
  const get = async <T = any>(path: string): Promise<ApiResponse<T>> => {
    try {
      const response = await $fetch<ApiResponse<T>>(`${baseURL}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response
    } catch (error: any) {
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
      })
      return response
    } catch (error: any) {
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
  }
}