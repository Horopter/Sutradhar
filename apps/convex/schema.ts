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
    }),

  // Adaptive Learning & Personalization
  learningPaths: defineTable({
    userId: "string",
    courseSlug: "string",
    pathData: "json",          // {lessons: [], order: [], difficulty: "string"}
    currentLesson: "string",
    startedAt: "number",
    completedAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    })
    .index("by_user_course", {
      fields: ["userId", "courseSlug"]
    }),

  learningPreferences: defineTable({
    userId: "string",
    learningStyle: "string",   // "visual" | "auditory" | "reading" | "kinesthetic"
    preferredFormat: "json",   // ["video", "text", "interactive"]
    pace: "string",            // "slow" | "normal" | "fast"
    difficulty: "string",      // "beginner" | "intermediate" | "advanced"
    updatedAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    }),

  skillAssessments: defineTable({
    userId: "string",
    skillName: "string",
    level: "number",           // 0-100
    confidence: "number",       // 0-100
    lastAssessedAt: "number",
    improvementRate: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    })
    .index("by_user_skill", {
      fields: ["userId", "skillName"]
    }),

  recommendations: defineTable({
    userId: "string",
    type: "string",            // "course" | "lesson" | "practice"
    itemId: "string",
    reason: "string",
    score: "number",           // 0-100
    createdAt: "number",
    viewedAt: "number"
  })
    .index("by_user", {
      fields: ["userId", "createdAt"]
    }),

  // Gamification
  achievements: defineTable({
    userId: "string",
    badgeId: "string",
    badgeName: "string",
    badgeType: "string",      // "completion" | "mastery" | "consistency" | "special"
    badgeIcon: "string",
    earnedAt: "number",
    rarity: "string"           // "common" | "rare" | "epic" | "legendary"
  })
    .index("by_user", {
      fields: ["userId", "earnedAt"]
    })
    .index("by_badge", {
      fields: ["badgeId"]
    }),

  points: defineTable({
    userId: "string",
    amount: "number",
    source: "string",           // "lesson_complete" | "quiz_pass" | "code_submit" | etc.
    description: "string",
    createdAt: "number"
  })
    .index("by_user", {
      fields: ["userId", "createdAt"]
    }),

  leaderboards: defineTable({
    type: "string",             // "global" | "course" | "weekly" | "monthly"
    courseSlug: "string",
    userId: "string",
    score: "number",
    rank: "number",
    period: "string",           // "week" | "month" | "all_time"
    updatedAt: "number"
  })
    .index("by_type", {
      fields: ["type", "period", "score"]
    })
    .index("by_course", {
      fields: ["courseSlug", "period", "score"]
    }),

  // Analytics
  learningAnalytics: defineTable({
    userId: "string",
    date: "string",            // YYYY-MM-DD
    timeSpent: "number",       // minutes
    lessonsCompleted: "number",
    quizzesPassed: "number",
    codeSubmissions: "number",
    averageScore: "number",
    engagementScore: "number"  // 0-100
  })
    .index("by_user_date", {
      fields: ["userId", "date"]
    }),

  learningSessions: defineTable({
    userId: "string",
    startedAt: "number",
    endedAt: "number",
    duration: "number",        // seconds
    activityType: "string",    // "lesson" | "quiz" | "code" | "forum"
    itemsCompleted: "array",   // string[]
    engagementScore: "number"
  })
    .index("by_user", {
      fields: ["userId", "startedAt"]
    }),

  // Social & Collaboration
  studyGroups: defineTable({
    name: "string",
    courseSlug: "string",
    description: "string",
    createdBy: "string",
    memberIds: "array",        // string[]
    createdAt: "number",
    isPublic: "boolean"
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_creator", {
      fields: ["createdBy"]
    }),

  studyGroupMembers: defineTable({
    groupId: "string",
    userId: "string",
    role: "string",            // "admin" | "member"
    joinedAt: "number"
  })
    .index("by_group", {
      fields: ["groupId"]
    })
    .index("by_user", {
      fields: ["userId"]
    }),

  forumPosts: defineTable({
    userId: "string",
    lessonId: "string",
    courseSlug: "string",
    title: "string",
    content: "string",
    tags: "array",             // string[]
    upvotes: "number",
    answerCount: "number",
    isAnswered: "boolean",
    createdAt: "number",
    updatedAt: "number"
  })
    .index("by_lesson", {
      fields: ["lessonId", "createdAt"]
    })
    .index("by_course", {
      fields: ["courseSlug", "createdAt"]
    })
    .index("by_user", {
      fields: ["userId"]
    }),

  forumReplies: defineTable({
    postId: "string",
    userId: "string",
    content: "string",
    upvotes: "number",
    isAccepted: "boolean",
    createdAt: "number",
    updatedAt: "number"
  })
    .index("by_post", {
      fields: ["postId", "createdAt"]
    })
    .index("by_user", {
      fields: ["userId"]
    }),

  liveSessions: defineTable({
    roomId: "string",
    title: "string",
    hostId: "string",
    participantIds: "array",  // string[]
    courseSlug: "string",
    scheduledAt: "number",
    startedAt: "number",
    endedAt: "number",
    type: "string"             // "office_hours" | "study_group" | "tutoring"
  })
    .index("by_host", {
      fields: ["hostId"]
    })
    .index("by_course", {
      fields: ["courseSlug"]
    }),

  // Content Generation
  generatedContent: defineTable({
    contentType: "string",     // "lesson" | "quiz" | "example" | "summary"
    courseSlug: "string",
    lessonId: "string",
    content: "json",
    generatedBy: "string",     // userId or "system"
    createdAt: "number",
    version: "number"
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_lesson", {
      fields: ["lessonId"]
    }),

  // Advanced Assessment
  dynamicQuizzes: defineTable({
    quizId: "string",
    courseSlug: "string",
    lessonId: "string",
    questions: "json",         // Generated questions
    difficulty: "string",
    generatedAt: "number",
    generatedBy: "string"      // "ai" | userId
  })
    .index("by_course", {
      fields: ["courseSlug"]
    })
    .index("by_lesson", {
      fields: ["lessonId"]
    }),

  codeReviews: defineTable({
    submissionId: "string",
    reviewerId: "string",      // userId or "ai"
    feedback: "json",          // {style: {}, correctness: {}, suggestions: []}
    score: "number",
    createdAt: "number"
  })
    .index("by_submission", {
      fields: ["submissionId"]
    }),

  // Study Tools
  notes: defineTable({
    userId: "string",
    lessonId: "string",
    courseSlug: "string",
    content: "string",         // Markdown
    tags: "array",             // string[]
    createdAt: "number",
    updatedAt: "number"
  })
    .index("by_user", {
      fields: ["userId", "updatedAt"]
    })
    .index("by_lesson", {
      fields: ["lessonId"]
    }),

  bookmarks: defineTable({
    userId: "string",
    itemType: "string",         // "lesson" | "discussion" | "code"
    itemId: "string",
    notes: "string",
    createdAt: "number"
  })
    .index("by_user", {
      fields: ["userId", "createdAt"]
    }),

  highlights: defineTable({
    userId: "string",
    lessonId: "string",
    text: "string",
    position: "json",          // {start: number, end: number}
    color: "string",
    note: "string",
    createdAt: "number"
  })
    .index("by_user_lesson", {
      fields: ["userId", "lessonId"]
    }),

  // Accessibility
  userPreferences: defineTable({
    userId: "string",
    theme: "string",           // "light" | "dark" | "high_contrast"
    fontSize: "string",        // "small" | "medium" | "large" | "xlarge"
    colorBlindMode: "boolean",
    screenReader: "boolean",
    keyboardNav: "boolean",
    language: "string",
    updatedAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    }),

  // Integration tracking
  integrations: defineTable({
    userId: "string",
    provider: "string",         // "github" | "slack" | "calendar" | "notion"
    connected: "boolean",
    accessToken: "string",
    refreshToken: "string",
    metadata: "json",
    connectedAt: "number",
    lastSyncAt: "number"
  })
    .index("by_user", {
      fields: ["userId"]
    })
    .index("by_provider", {
      fields: ["provider", "userId"]
    })
});

