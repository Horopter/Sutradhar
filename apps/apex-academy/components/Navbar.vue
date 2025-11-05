<template>
  <nav class="sticky top-0 z-50 border-b" style="background-color: var(--theme-dark); border-color: color-mix(in srgb, var(--theme-primary) 30%, transparent);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="text-xl sm:text-2xl font-bold" style="color: var(--theme-primary);">🎓 Apex Academy</span>
        </NuxtLink>
        
        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-2 xl:space-x-4">
          <NuxtLink v-if="!isAuthenticated" to="/login" class="btn-secondary text-sm">
            Login
          </NuxtLink>
          <template v-else>
            <NuxtLink to="/dashboard" class="btn-secondary text-sm hidden xl:inline-block">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/catalog" class="btn-secondary text-sm">
              Courses
            </NuxtLink>
            <NuxtLink to="/analytics" class="btn-secondary text-sm hidden xl:inline-block">
              Analytics
            </NuxtLink>
            <NuxtLink to="/achievements" class="btn-secondary text-sm hidden xl:inline-block">
              Achievements
            </NuxtLink>
            <NuxtLink to="/forum" class="btn-secondary text-sm hidden xl:inline-block">
              Forum
            </NuxtLink>
          </template>
          
          <NuxtLink to="/subjects" class="btn-secondary text-sm hidden xl:inline-block">
            Subjects
          </NuxtLink>
          
          <!-- Theme Switcher -->
          <ThemeSwitcher />
          
          <button v-if="isGuest" class="px-3 py-1 text-xs sm:text-sm rounded" style="background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent); color: var(--theme-primary);">
            Guest
          </button>
          
          <button v-if="isAuthenticated" @click="logout" class="btn-secondary text-sm">
            Logout
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="lg:hidden flex items-center space-x-2">
          <ThemeSwitcher />
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="p-2 rounded-lg transition-colors"
            style="color: var(--theme-text);"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="mobileMenuOpen"
          class="lg:hidden pb-4 border-t mt-2 pt-4"
          style="border-color: color-mix(in srgb, var(--theme-primary) 30%, transparent);"
        >
          <div class="flex flex-col space-y-2">
            <NuxtLink
              v-if="!isAuthenticated"
              to="/login"
              @click="mobileMenuOpen = false"
              class="btn-secondary w-full text-center py-3"
            >
              Login
            </NuxtLink>
            <template v-else>
              <NuxtLink
                to="/dashboard"
                @click="mobileMenuOpen = false"
                class="btn-secondary w-full text-center py-3"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/catalog"
                @click="mobileMenuOpen = false"
                class="btn-secondary w-full text-center py-3"
              >
                Courses
              </NuxtLink>
              <NuxtLink
                to="/analytics"
                @click="mobileMenuOpen = false"
                class="btn-secondary w-full text-center py-3"
              >
                Analytics
              </NuxtLink>
              <NuxtLink
                to="/achievements"
                @click="mobileMenuOpen = false"
                class="btn-secondary w-full text-center py-3"
              >
                Achievements
              </NuxtLink>
              <NuxtLink
                to="/forum"
                @click="mobileMenuOpen = false"
                class="btn-secondary w-full text-center py-3"
              >
                Forum
              </NuxtLink>
            </template>
            
            <NuxtLink
              to="/subjects"
              @click="mobileMenuOpen = false"
              class="btn-secondary w-full text-center py-3"
            >
              Subjects
            </NuxtLink>
            
            <button
              v-if="isGuest"
              class="w-full px-4 py-3 text-sm rounded-lg"
              style="background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent); color: var(--theme-primary);"
            >
              Guest Mode
            </button>
            
            <button
              v-if="isAuthenticated"
              @click="logout(); mobileMenuOpen = false"
              class="btn-secondary w-full text-center py-3"
            >
              Logout
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { isAuthenticated, isGuest, logout } = useAuth()
const mobileMenuOpen = ref(false)

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('nav')) {
      mobileMenuOpen.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

