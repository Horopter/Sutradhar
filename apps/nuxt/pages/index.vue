<template>
  <div class="min-h-screen bg-gradient-to-br from-halloween-bg via-halloween-dark to-halloween-bg">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-halloween-orange mb-4 animate-pulse-slow">🎃 Apex Academy</h1>
        <p class="text-xl text-halloween-ghost mb-8">Learn Computer Science with AI-powered tutoring</p>
        
        <div class="flex gap-4 justify-center">
          <NuxtLink
            to="/catalog"
            class="btn-primary"
          >
            {{ isAuthenticated ? 'Browse Courses' : 'Get Started' }}
          </NuxtLink>
          <NuxtLink
            v-if="!isAuthenticated || isGuest"
            to="/login"
            class="btn-secondary"
          >
            Login / Sign Up
          </NuxtLink>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <div class="card">
          <div class="text-4xl mb-4">📚</div>
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">Interactive Courses</h3>
          <p class="text-halloween-ghost/80">Learn through hands-on lessons and practical examples</p>
        </div>
        <div class="card">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">AI Tutor</h3>
          <p class="text-halloween-ghost/80">Get instant help and explanations from your AI assistant</p>
        </div>
        <div class="card">
          <div class="text-4xl mb-4">💻</div>
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">Code Practice</h3>
          <p class="text-halloween-ghost/80">Practice coding with real-time feedback and hints</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth()

useHead({
  title: 'Apex Academy - Learn Computer Science',
})
</script>
