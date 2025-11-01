<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-12">
      <h1 class="text-6xl font-bold text-halloween-orange mb-4 animate-glow">
        🎃 Apex Academy
      </h1>
      <p class="text-2xl text-halloween-ghost/80 mb-8">
        Master Computer Science with AI-Powered Learning
      </p>
      
      <div class="flex justify-center space-x-4 mb-12">
        <NuxtLink v-if="!isAuthenticated" to="/login" class="btn-primary text-xl px-8 py-4">
          Continue as Guest
        </NuxtLink>
        <NuxtLink v-else to="/subjects" class="btn-primary text-xl px-8 py-4">
          Continue Learning
        </NuxtLink>
        <NuxtLink to="/subjects" class="btn-secondary text-xl px-8 py-4">
          Explore Subjects
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
      <div class="card text-center">
        <div class="text-4xl mb-4">📚</div>
        <h3 class="text-xl font-bold text-halloween-orange mb-2">5 CS Subjects</h3>
        <p class="text-halloween-ghost/70">Learn C++, Java, Web Dev, Android, and ML</p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">🤖</div>
        <h3 class="text-xl font-bold text-halloween-orange mb-2">AI Tutoring</h3>
        <p class="text-halloween-ghost/70">Get instant hints and explanations from Sutradhar</p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">🏆</div>
        <h3 class="text-xl font-bold text-halloween-orange mb-2">Track Progress</h3>
        <p class="text-halloween-ghost/70">Earn badges, maintain streaks, and level up</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { isAuthenticated } = useAuth()

useHead({
  title: 'Apex Academy - Home'
})
</script>

