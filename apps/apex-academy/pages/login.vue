<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-halloween-bg via-halloween-dark to-halloween-bg px-4">
    <div class="max-w-md w-full card">
      <h1 class="text-3xl font-bold text-center mb-8 text-halloween-orange">🎃 Welcome to Apex Academy</h1>

      <div v-if="error" class="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300">
        {{ error }}
      </div>

      <div v-if="magicLinkSent" class="mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300">
        Magic link sent! Check your email.
      </div>

      <!-- Guest Login -->
      <button
        @click="handleGuestLogin"
        :disabled="loading"
        class="btn-primary w-full mb-4"
      >
        {{ loading ? 'Logging in...' : 'Continue as Guest' }}
      </button>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-halloween-orange/30"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-halloween-card text-halloween-ghost/60">Or</span>
        </div>
      </div>

      <!-- Magic Link Login -->
      <form @submit.prevent="handleMagicLink" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-halloween-ghost mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="input-field"
            placeholder="your@email.com"
          />
        </div>
        <button
          type="submit"
          :disabled="loading || !email"
          class="btn-secondary w-full"
        >
          {{ loading ? 'Sending...' : 'Send Magic Link' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { loginAsGuest, loginWithMagicLink, isAuthenticated } = useAuth()

const email = ref('')
const loading = ref(false)
const error = ref('')
const magicLinkSent = ref(false)

if (isAuthenticated.value) {
  router.push('/catalog')
}

const handleGuestLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await loginAsGuest()
    if (result.ok) {
      router.push('/catalog')
    } else {
      error.value = result.error || 'Login failed'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const handleMagicLink = async () => {
  loading.value = true
  error.value = ''
  magicLinkSent.value = false
  try {
    const result = await loginWithMagicLink(email.value)
    if (result.ok) {
      magicLinkSent.value = true
      email.value = ''
    } else {
      error.value = result.error || 'Failed to send magic link'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Login - Apex Academy',
})
</script>