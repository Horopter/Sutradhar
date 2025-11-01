<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-halloween-orange mb-8">Dashboard</h1>

    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading progress...</p>
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card text-center">
          <div class="text-3xl font-bold text-halloween-orange mb-2">{{ progress?.streak || 0 }}</div>
          <div class="text-halloween-ghost/70">Day Streak</div>
        </div>
        
        <div class="card text-center">
          <div class="text-3xl font-bold text-halloween-orange mb-2">{{ badges?.length || 0 }}</div>
          <div class="text-halloween-ghost/70">Badges</div>
        </div>
        
        <div class="card text-center">
          <div class="text-3xl font-bold text-halloween-orange mb-2">{{ quizAttempts?.length || 0 }}</div>
          <div class="text-halloween-ghost/70">Quiz Attempts</div>
        </div>
        
        <div class="card text-center">
          <div class="text-3xl font-bold text-halloween-orange mb-2">
            {{ passedQuizzes }}
          </div>
          <div class="text-halloween-ghost/70">Quizzes Passed</div>
        </div>
      </div>

      <!-- Badges -->
      <div class="card mb-8">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Badges</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="badge in badges"
            :key="badge"
            class="px-4 py-2 bg-halloween-orange/20 border border-halloween-orange rounded-lg"
          >
            🏆 {{ badge }}
          </div>
          <div v-if="badges.length === 0" class="text-halloween-ghost/60">
            No badges yet. Complete lessons and quizzes to earn badges!
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Recent Activity</h2>
        <div class="space-y-2">
          <div
            v-for="event in recentEvents"
            :key="event.id"
            class="p-3 bg-halloween-dark rounded-lg"
          >
            <div class="flex justify-between">
              <span class="text-halloween-ghost">{{ event.type }}</span>
              <span class="text-halloween-ghost/60 text-sm">{{ formatDate(event.ts) }}</span>
            </div>
          </div>
          <div v-if="recentEvents.length === 0" class="text-halloween-ghost/60">
            No recent activity.
          </div>
        </div>
      </div>

      <!-- Study Plan -->
      <div class="card mt-8">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Study Plan</h2>
        <button @click="createStudyPlan" :disabled="creatingPlan" class="btn-primary">
          {{ creatingPlan ? 'Creating...' : 'Create 2-Week Study Plan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, sessionId } = useAuth()
const { get, post } = useApi()

const progress = ref(null)
const quizAttempts = ref([])
const badges = ref([])
const events = ref([])
const loading = ref(true)
const creatingPlan = ref(false)

const passedQuizzes = computed(() => {
  return quizAttempts.value.filter((q: any) => q.passed).length
})

const recentEvents = computed(() => {
  return events.value.slice(0, 10)
})

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString()
}

const createStudyPlan = async () => {
  if (!user.value) return
  creatingPlan.value = true
  try {
    const result = await post('/schedule/study', {
      userId: user.value.id,
      sessionId: sessionId.value
    })
    if (result.ok) {
      alert('Study plan created! Check your calendar.')
    }
  } catch (error: any) {
    alert('Failed to create study plan: ' + error.message)
  } finally {
    creatingPlan.value = false
  }
}

onMounted(async () => {
  if (!user.value) {
    await navigateTo('/login')
    return
  }

  try {
    const result = await get<{ ok: boolean; user: any; quizAttempts: any[]; events: any[] }>('/progress', {
      userId: user.value.id
    })
    if (result.ok) {
      progress.value = result.user
      quizAttempts.value = result.quizAttempts || []
      badges.value = result.badges || []
      events.value = result.events || []
    }
  } catch (err: any) {
    console.error('Failed to load progress', err)
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Dashboard - Apex Academy'
})
</script>

