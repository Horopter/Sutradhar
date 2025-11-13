<template>
  <div class="min-h-screen" :style="backgroundStyle">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-8 sm:mb-12">
        <div class="flex justify-center mb-4">
          <Logo :size="120" :show-text="false" />
        </div>
        <p class="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 px-4" style="color: var(--theme-text-secondary);">Learn Computer Science with AI-powered tutoring</p>
        
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <NuxtLink
            to="/catalog"
            class="btn-primary w-full sm:w-auto min-w-[200px]"
          >
            {{ isAuthenticated ? 'Browse Courses' : 'Get Started' }}
          </NuxtLink>
          <NuxtLink
            v-if="!isAuthenticated || isGuest"
            to="/login"
            class="btn-secondary w-full sm:w-auto min-w-[200px]"
          >
            Login / Sign Up
          </NuxtLink>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-16">
        <div class="card">
          <div class="text-4xl mb-4">📚</div>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">Interactive Courses</h3>
          <p style="color: var(--theme-text-secondary);">Learn through hands-on lessons and practical examples</p>
        </div>
        <div class="card">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">AI Tutor</h3>
          <p style="color: var(--theme-text-secondary);">Get instant help and explanations from your AI assistant</p>
        </div>
        <div class="card">
          <div class="text-4xl mb-4">💻</div>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">Code Practice</h3>
          <p style="color: var(--theme-text-secondary);">Practice coding with real-time feedback and hints</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, isGuest } = useAuth()

// Use computed style to avoid hydration mismatch - same value for SSR and client
const backgroundStyle = computed(() => ({
  background: 'linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-dark) 100%)'
}))

useHead({
  title: 'Masterbolt - Learn Computer Science',
})
</script>
