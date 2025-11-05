<template>
  <nav class="bg-halloween-dark border-b border-halloween-orange/30 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="text-2xl font-bold text-halloween-orange">🎃 Apex Academy</span>
        </NuxtLink>
        
        <div class="flex items-center space-x-4">
          <NuxtLink v-if="!isAuthenticated" to="/login" class="btn-secondary">
            Login
          </NuxtLink>
          <NuxtLink v-else to="/dashboard" class="btn-secondary">
            Dashboard
          </NuxtLink>
          
          <NuxtLink to="/subjects" class="btn-secondary">
            Subjects
          </NuxtLink>
          
          <button v-if="isGuest" class="px-3 py-1 text-sm bg-halloween-orange/20 text-halloween-orange rounded">
            Guest Mode
          </button>
          
          <button v-if="isAuthenticated" @click="logout" class="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const { isAuthenticated, isGuest, logout } = useAuth()
</script>

