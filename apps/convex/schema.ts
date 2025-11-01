import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  sessions: defineTable({
    channel: "string",        // "voice" | "slack" | "forum" | "email"
    persona: "string",        // "Greeter" | "Moderator" | "Escalator"
    userName: "string",
    startedAt: "number",
    endedAt: "number"
  }),

  messages: defineTable({
    sessionId: "string",
    from: "string",           // "user" | "agent" | "human"
    text: "string",
    sourceRefs: "json",       // [{type,id,title,url}]
    latencyMs: "number",
    ts: "number"
  }).index("by_session", {
    fields: ["sessionId", "ts"]
  }),

  actions: defineTable({
    sessionId: "string",
    type: "string",           // "slack" | "calendar" | "github" | "forum"
    status: "string",         // "ok" | "error" | "mocked"
    payload: "json",
    result: "json",
    ts: "number"
  }).index("by_session_ts", {
    fields: ["sessionId", "ts"]
  }),

  escalations: defineTable({
    sessionId: "string",
    reason: "string",
    severity: "string",       // "P0"|"P1"|"P2"
    agentmailThreadId: "string",
    status: "string",         // "open"|"ack"|"closed"
    lastEmailAt: "number",
    createdAt: "number"
  }),

  logs: defineTable({
    sessionId: "string",
    requestId: "string",
    level: "string",          // "error"|"warn"|"info"|"verbose"|"debug"
    message: "string",
    timestamp: "number",
    metadata: "json",         // Additional context
    service: "string",
    path: "string",
    method: "string",
    statusCode: "number",
    durationMs: "number",
    error: "json"             // {message, stack}
  })
    .index("by_session", {
      fields: ["sessionId", "timestamp"]
    })
    .index("by_timestamp", {
      fields: ["timestamp"]
    })
    .index("by_level", {
      fields: ["level", "timestamp"]
    }),

  // EdTech tables
  users: defineTable({
    email: "string",
    name: "string",
    role: "string",           // "user" | "guest" | "admin"
    createdAt: "number",
    lastLoginAt: "number",
    streak: "number",
    badges: "array"           // string[]
  })
    .index("by_email", {
      fields: ["email"]
    }),

  courses: defineTable({
    slug: "string",
    title: "string",
    description: "string",
    coverImg: "string"
  })
    .index("by_slug", {
      fields: ["slug"]
    }),

  lessons: defineTable({
    courseSlug: "string",
    lessonId: "string",
    title: "string",
    body: "string",
    assets: "array",          // string[]
    difficulty: "string"      // "beginner" | "intermediate" | "advanced"
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_course_lesson", {
      fields: ["courseSlug", "lessonId"]
    }),

  quizzes: defineTable({
    courseSlug: "string",
    quizId: "string",
    title: "string",
    questions: "json",        // Question[]
    passScore: "number"
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_quiz", {
      fields: ["quizId"]
    }),

  quizAttempts: defineTable({
    userId: "string",
    quizId: "string",
    score: "number",
    answers: "json",          // any[]
    startedAt: "number",
    finishedAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    })
    .index("by_quiz", {
      fields: ["quizId"]
    })
    .index("by_user_quiz", {
      fields: ["userId", "quizId"]
    }),

  codeAssignments: defineTable({
    courseSlug: "string",
    assignmentId: "string",
    title: "string",
    prompt: "string",
    starterCode: "string",
    language: "string",       // "javascript" | "python" | "cpp"
    tests: "json"             // TestCase[]
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_assignment", {
      fields: ["assignmentId"]
    }),

  codeSubmissions: defineTable({
    userId: "string",
    assignmentId: "string",
    code: "string",
    results: "json",          // {passed: number, total: number, cases: any[]}
    createdAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    })
    .index("by_assignment", {
      fields: ["assignmentId"]
    })
    .index("by_user_assignment", {
      fields: ["userId", "assignmentId"]
    }),

  images: defineTable({
    courseSlug: "string",
    url: "string",
    source: "string",         // "moss" | "local"
    caption: "string"
  })
    .index("by_course", {
      fields: ["courseSlug"]
    }),

  events: defineTable({
    userId: "string",
    type: "string",           // "lesson_view" | "quiz_attempt" | "code_submit" | etc.
    payload: "json",
    ts: "number"
  })
    .index("by_user", {
      fields: ["userId", "ts"]
    })
    .index("by_type", {
      fields: ["type", "ts"]
    }),

  schedules: defineTable({
    userId: "string",
    title: "string",
    startISO: "string",
    endISO: "string",
    provider: "string"        // "google" | "outlook" | "local"
  })
    .index("by_user", {
      fields: ["userId"]
    })
});

