<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 class="text-4xl font-bold" style="color: var(--theme-primary);">📊 Dashboard</h1>
        <div class="flex gap-4">
          <NuxtLink
            to="/catalog"
            class="btn-secondary"
          >
            Browse Courses
          </NuxtLink>
          <button
            @click="handleLogout"
            class="btn-secondary"
          >
            Logout
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading progress...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4 mb-6" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- Quick Stats -->
        <div class="grid md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">🔥 Streak</h3>
            <div class="text-4xl font-bold" style="color: var(--theme-primary);">{{ progress?.streak || 0 }}</div>
            <p class="mt-2" style="color: var(--theme-text-secondary);">days in a row</p>
          </div>

          <div class="card">
            <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">🏆 Badges</h3>
            <div class="text-4xl font-bold" style="color: var(--theme-primary);">{{ progress?.badges?.length || 0 }}</div>
            <p class="mt-2" style="color: var(--theme-text-secondary);">earned</p>
          </div>

          <div class="card">
            <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">📝 Quiz Attempts</h3>
            <div class="text-4xl font-bold" style="color: var(--theme-primary);">{{ progress?.quizAttempts?.length || 0 }}</div>
            <p class="mt-2" style="color: var(--theme-text-secondary);">completed</p>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/analytics" class="card transition-colors cursor-pointer">
            <div class="text-3xl mb-2">📊</div>
            <div class="font-semibold" style="color: var(--theme-primary);">Analytics</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">View your learning insights</div>
          </NuxtLink>

          <NuxtLink to="/achievements" class="card transition-colors cursor-pointer">
            <div class="text-3xl mb-2">🏆</div>
            <div class="font-semibold" style="color: var(--theme-primary);">Achievements</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">See your badges & points</div>
          </NuxtLink>

          <NuxtLink to="/catalog" class="card transition-colors cursor-pointer">
            <div class="text-3xl mb-2">📚</div>
            <div class="font-semibold" style="color: var(--theme-primary);">Courses</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Browse courses</div>
          </NuxtLink>

          <NuxtLink to="/forum" class="card transition-colors cursor-pointer">
            <div class="text-3xl mb-2">💬</div>
            <div class="font-semibold" style="color: var(--theme-primary);">Forum</div>
            <div class="text-sm" style="color: var(--theme-text-secondary);">Join discussions</div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const router = useRouter()
const api = useApi()
const { user, logout } = useAuth()

const progress = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!user.value?.userId) {
    error.value = 'User ID not found'
    loading.value = false
    return
  }

  loading.value = true
  const response = await api.progress.get(user.value.userId)
  if (response.ok) {
    progress.value = response
  } else {
    error.value = response.error || 'Failed to load progress'
  }
  loading.value = false
})

const handleLogout = () => {
  logout()
  router.push('/login')
}

useHead({
  title: 'Dashboard - Apex Academy',
})
</script>