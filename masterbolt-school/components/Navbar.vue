<template>
  <nav class="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-700/50 backdrop-blur-xl bg-black/60">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <NuxtLink to="/" class="flex items-center">
            <Logo :size="144" :show-text="true" />
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <a 
            href="#product" 
            class="nav-link"
            @click.prevent="handleNavClick('product')"
          >
            Product
          </a>
          <a 
            href="#features" 
            class="nav-link"
            @click.prevent="handleNavClick('features')"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            class="nav-link"
            @click.prevent="handleNavClick('how-it-works')"
          >
            How It Works
          </a>
          <a 
            href="#use-cases" 
            class="nav-link"
            @click.prevent="handleNavClick('use-cases')"
          >
            Use Cases
          </a>
          <a 
            href="#pricing" 
            class="nav-link"
            @click.prevent="handleNavClick('pricing')"
          >
            Pricing
          </a>
          <div class="relative group">
            <button class="nav-link flex items-center">
              Company
              <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="absolute left-0 mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-slate-700/50">
              <a href="#about" class="block px-4 py-2 text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors" @click.prevent="handleNavClick('about')">
                About Us
              </a>
              <a href="#contact" class="block px-4 py-2 text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors" @click.prevent="handleNavClick('contact')">
                Contact
              </a>
            </div>
          </div>
          <div class="relative group">
            <button class="nav-link flex items-center">
              Legal
              <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-slate-700/50">
              <NuxtLink to="/legal/privacy-policy" class="block px-4 py-2 text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                Privacy Policy
              </NuxtLink>
              <NuxtLink to="/legal/terms-of-service" class="block px-4 py-2 text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                Terms of Service
              </NuxtLink>
              <NuxtLink to="/legal/cookie-policy" class="block px-4 py-2 text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                Cookie Policy
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <button 
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-700/20 transition-colors"
        >
          <svg v-if="!mobileMenuOpen" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div 
        v-show="mobileMenuOpen"
        class="md:hidden pb-4 space-y-2"
      >
        <a href="#product" class="block px-4 py-2 rounded-lg hover:bg-slate-700/20 transition-colors text-slate-300" @click.prevent="handleNavClick('product'); mobileMenuOpen = false">
          Product
        </a>
        <a href="#features" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('features'); mobileMenuOpen = false">
          Features
        </a>
        <a href="#how-it-works" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('how-it-works'); mobileMenuOpen = false">
          How It Works
        </a>
        <a href="#use-cases" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('use-cases'); mobileMenuOpen = false">
          Use Cases
        </a>
        <a href="#pricing" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('pricing'); mobileMenuOpen = false">
          Pricing
        </a>
        <a href="#about" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('about'); mobileMenuOpen = false">
          About Us
        </a>
        <a href="#contact" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors" @click.prevent="handleNavClick('contact'); mobileMenuOpen = false">
          Contact
        </a>
        <div class="border-t border-white/20 pt-2 mt-2">
          <NuxtLink to="/legal/privacy-policy" class="block px-4 py-2 rounded-lg hover:bg-slate-700/20 transition-colors text-slate-300">
            Privacy Policy
          </NuxtLink>
          <NuxtLink to="/legal/terms-of-service" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            Terms of Service
          </NuxtLink>
          <NuxtLink to="/legal/cookie-policy" class="block px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            Cookie Policy
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)

const handleNavClick = (id: string) => {
  // If we're not on the home page, navigate there first
  if (route.path !== '/') {
    router.push('/').then(() => {
      // Wait for page to load, then scroll
      setTimeout(() => {
        scrollToSection(id)
      }, 100)
    })
  } else {
    // Already on home page, just scroll
    scrollToSection(id)
  }
}

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Update URL hash without triggering scroll
    window.history.pushState(null, '', `#${id}`)
  }
}
</script>

<style scoped>
.nav-link {
  @apply text-slate-300 font-medium hover:text-primary transition-colors duration-200 relative;
}

.nav-link::after {
  content: '';
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300;
}

.nav-link:hover::after {
  @apply w-full;
}
</style>

