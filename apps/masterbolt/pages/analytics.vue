<template>
  <div class="min-h-screen" style="background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-dark) 100%);">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8" style="color: var(--theme-primary);">Learning Analytics</h1>

      <div v-if="loading" class="text-center py-12">
        <div style="color: var(--theme-text);">Loading analytics...</div>
      </div>

      <div v-else-if="error" class="card rounded-xl border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        <p>{{ error }}</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid md:grid-cols-4 gap-4">
          <div class="card">
            <div class="text-2xl font-bold" style="color: var(--theme-primary);">{{ totalTime }}m</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Total Time</div>
          </div>
          <div class="card">
            <div class="text-2xl font-bold" style="color: var(--theme-primary);">{{ lessonsCompleted }}</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Lessons Completed</div>
          </div>
          <div class="card">
            <div class="text-2xl font-bold" style="color: var(--theme-primary);">{{ quizzesPassed }}</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Quizzes Passed</div>
          </div>
          <div class="card">
            <div class="text-2xl font-bold" style="color: var(--theme-primary);">{{ avgScore }}%</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Average Score</div>
          </div>
        </div>

        <!-- Weekly Report -->
        <div class="card">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">Weekly Report</h2>
          <div v-if="report">
            <div class="space-y-4">
              <div>
                <div class="flex justify-between mb-2">
                  <span style="color: var(--theme-text);">Time Spent</span>
                  <span class="font-semibold" style="color: var(--theme-text);">{{ report.totalTimeSpent }} minutes</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span style="color: var(--theme-text);">Sessions</span>
                  <span class="font-semibold" style="color: var(--theme-text);">{{ report.sessions }}</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span style="color: var(--theme-text);">Engagement Trend</span>
                  <span class="font-semibold capitalize" style="color: var(--theme-text);">{{ report.engagementTrend }}</span>
                </div>
              </div>
              <div v-if="report.recommendations && report.recommendations.length > 0">
                <h3 class="font-semibold mb-2" style="color: var(--theme-text);">Recommendations</h3>
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="(rec, i) in report.recommendations" :key="i" style="color: var(--theme-text-secondary);">
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Predictions -->
        <div class="card">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">Predictions</h2>
          <div v-if="completionPrediction" class="space-y-4">
            <div>
              <div class="flex justify-between mb-2">
                <span style="color: var(--theme-text);">Completion Probability</span>
                <span class="font-semibold" style="color: var(--theme-text);">{{ completionPrediction.value }}%</span>
              </div>
              <div class="w-full rounded-full h-2" style="background-color: var(--theme-dark);">
                <div 
                  class="h-2 rounded-full" 
                  :style="{ width: `${completionPrediction.value}%`, backgroundColor: 'var(--theme-primary)' }"
                ></div>
              </div>
              <p class="text-sm mt-2" style="color: var(--theme-text-secondary);">{{ completionPrediction.explanation }}</p>
            </div>
          </div>
        </div>

        <!-- At-Risk Status -->
        <div v-if="atRisk" class="card rounded-xl border" :style="atRisk.value > 70 ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' } : {}">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">At-Risk Status</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span style="color: var(--theme-text);">Risk Level</span>
              <span class="font-semibold" style="color: var(--theme-text);">{{ atRisk.value }}%</span>
            </div>
            <p class="text-sm" style="color: var(--theme-text-secondary);">{{ atRisk.explanation }}</p>
          </div>
        </div>

        <!-- Optimal Learning Times -->
        <div v-if="optimalTimes" class="card">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">Optimal Learning Times</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span style="color: var(--theme-text);">Best Hour</span>
              <span class="font-semibold" style="color: var(--theme-text);">{{ formatHour(optimalTimes.value) }}</span>
            </div>
            <p class="text-sm" style="color: var(--theme-text-secondary);">{{ optimalTimes.explanation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user } = useAuth()
const api = useApi()

const loading = ref(true)
const error = ref<string | null>(null)
const analytics = ref<any[]>([])
const report = ref<any>(null)
const completionPrediction = ref<any>(null)
const atRisk = ref<any>(null)
const optimalTimes = ref<any>(null)

const totalTime = computed(() => {
  return analytics.value.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
})

const lessonsCompleted = computed(() => {
  return analytics.value.reduce((sum, a) => sum + (a.lessonsCompleted || 0), 0)
})

const quizzesPassed = computed(() => {
  return analytics.value.reduce((sum, a) => sum + (a.quizzesPassed || 0), 0)
})

const avgScore = computed(() => {
  const scores = analytics.value.filter(a => a.averageScore > 0).map(a => a.averageScore)
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

const formatHour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${h}:00 ${period}`
}

onMounted(async () => {
  if (!user.value?.userId) {
    error.value = 'Please log in to view analytics'
    loading.value = false
    return
  }

  try {
    // Load analytics data
    const analyticsRes = await api.analytics.get(user.value.userId)
    if (analyticsRes.ok) {
      analytics.value = analyticsRes.analytics || []
    }

    // Load weekly report
    const reportRes = await api.analytics.getReport(user.value.userId, 'week')
    if (reportRes.ok) {
      report.value = reportRes
    }

    // Load completion prediction (if on a course page)
    const courseSlug = route.query.courseSlug as string
    if (courseSlug) {
      const predRes = await api.analytics.predictCompletion(user.value.userId, courseSlug)
      if (predRes.ok) {
        completionPrediction.value = predRes
      }

      const riskRes = await api.analytics.detectAtRisk(user.value.userId, courseSlug)
      if (riskRes.ok) {
        atRisk.value = riskRes
      }
    }

    // Load optimal times
    const timesRes = await api.analytics.getOptimalTimes(user.value.userId)
    if (timesRes.ok) {
      optimalTimes.value = timesRes
    }

    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load analytics'
    loading.value = false
  }
})

useHead({
  title: 'Analytics - Masterbolt'
})
</script>

