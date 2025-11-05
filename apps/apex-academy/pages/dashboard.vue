<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-halloween-orange">📊 Dashboard</h1>
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
        <div class="text-lg text-halloween-ghost/60">Loading progress...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 mb-6">
        {{ error }}
      </div>

      <div v-else class="grid md:grid-cols-3 gap-6">
        <div class="card">
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">🔥 Streak</h3>
          <div class="text-4xl font-bold text-halloween-orange animate-pulse-slow">{{ progress?.streak || 0 }}</div>
          <p class="text-halloween-ghost/80 mt-2">days in a row</p>
        </div>

        <div class="card">
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">🏆 Badges</h3>
          <div class="text-4xl font-bold text-halloween-orange">{{ progress?.badges?.length || 0 }}</div>
          <p class="text-halloween-ghost/80 mt-2">earned</p>
        </div>

        <div class="card">
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">📝 Quiz Attempts</h3>
          <div class="text-4xl font-bold text-halloween-orange">{{ progress?.quizAttempts?.length || 0 }}</div>
          <p class="text-halloween-ghost/80 mt-2">completed</p>
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