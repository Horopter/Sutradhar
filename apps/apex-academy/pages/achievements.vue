<template>
  <div class="min-h-screen" style="background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-dark) 100%);">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8" style="color: var(--theme-primary);">🏆 Achievements</h1>

      <div v-if="loading" class="text-center py-12">
        <div style="color: var(--theme-text);">Loading achievements...</div>
      </div>

      <div v-else-if="error" class="card rounded-xl border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        <p>{{ error }}</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Points Summary -->
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-bold" style="color: var(--theme-primary);">{{ totalPoints }}</div>
              <div style="color: var(--theme-text-secondary);">Total Points</div>
            </div>
            <div v-if="rank" class="text-right">
              <div class="text-2xl font-bold" style="color: var(--theme-primary);">#{{ rank.rank }}</div>
              <div style="color: var(--theme-text-secondary);">Global Rank</div>
            </div>
          </div>
        </div>

        <!-- Achievements Grid -->
        <div>
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">Badges</h2>
          <div v-if="achievements.length === 0" class="card text-center py-12">
            <p style="color: var(--theme-text-secondary);">No achievements yet. Keep learning to earn badges!</p>
          </div>
          <div v-else class="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div 
              v-for="achievement in achievements" 
              :key="achievement.badgeId"
              class="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div class="text-4xl mb-2">{{ achievement.badgeIcon }}</div>
              <div class="font-semibold" style="color: var(--theme-primary);">{{ achievement.badgeName }}</div>
              <div class="text-sm capitalize" style="color: var(--theme-text-secondary);">{{ achievement.badgeType }}</div>
              <div class="text-xs mt-1 capitalize" style="color: var(--theme-text-secondary); opacity: 0.7;">{{ achievement.rarity }}</div>
              <div class="text-xs mt-2" style="color: var(--theme-text-secondary); opacity: 0.7;">
                Earned {{ new Date(achievement.earnedAt).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="card">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-primary);">Leaderboard</h2>
          <div class="flex gap-2 mb-4">
            <button 
              v-for="type in ['global', 'weekly', 'monthly']" 
              :key="type"
              @click="selectedLeaderboard = type"
              class="px-4 py-2 rounded transition-colors"
              :style="selectedLeaderboard === type 
                ? { backgroundColor: 'var(--theme-primary)', color: 'white' }
                : { backgroundColor: 'var(--theme-dark)', color: 'var(--theme-text)' }"
            >
              {{ type.charAt(0).toUpperCase() + type.slice(1) }}
            </button>
          </div>
          <div v-if="leaderboardLoading" class="text-center py-4">
            <div style="color: var(--theme-text);">Loading...</div>
          </div>
          <div v-else-if="leaderboard.length === 0" class="text-center py-4">
            <div style="color: var(--theme-text-secondary);">No leaderboard data</div>
          </div>
          <div v-else class="space-y-2">
            <div 
              v-for="(entry, index) in leaderboard.slice(0, 10)" 
              :key="entry.userId"
              class="flex items-center justify-between p-3 rounded"
              style="background-color: var(--theme-dark);"
            >
              <div class="flex items-center gap-3">
                <div class="text-2xl font-bold w-8 text-center" style="color: var(--theme-primary);">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="font-semibold" style="color: var(--theme-text);">User {{ entry.userId.substring(0, 8) }}</div>
                  <div class="text-sm" style="color: var(--theme-text-secondary);">{{ entry.score }} points</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const api = useApi()

const loading = ref(true)
const error = ref<string | null>(null)
const achievements = ref<any[]>([])
const totalPoints = ref(0)
const rank = ref<any>(null)
const leaderboard = ref<any[]>([])
const leaderboardLoading = ref(false)
const selectedLeaderboard = ref<'global' | 'weekly' | 'monthly'>('global')

onMounted(async () => {
  if (!user.value?.userId) {
    error.value = 'Please log in to view achievements'
    loading.value = false
    return
  }

  try {
    // Load achievements
    const achievementsRes = await api.gamification.getAchievements(user.value.userId)
    if (achievementsRes.ok) {
      achievements.value = achievementsRes.achievements || []
    }

    // Load points
    const pointsRes = await api.gamification.getPoints(user.value.userId)
    if (pointsRes.ok) {
      totalPoints.value = pointsRes.totalPoints || 0
    }

    // Load rank
    const rankRes = await api.gamification.getRank(user.value.userId, 'global')
    if (rankRes.ok) {
      rank.value = rankRes
    }

    await loadLeaderboard()
    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load achievements'
    loading.value = false
  }
})

const loadLeaderboard = async () => {
  leaderboardLoading.value = true
  try {
    const res = await api.gamification.getLeaderboard(selectedLeaderboard.value)
    if (res.ok) {
      leaderboard.value = res.leaderboard || []
    }
  } catch (err: any) {
    console.error('Failed to load leaderboard:', err)
  } finally {
    leaderboardLoading.value = false
  }
}

watch(selectedLeaderboard, () => {
  loadLeaderboard()
})

useHead({
  title: 'Achievements - Apex Academy'
})
</script>

