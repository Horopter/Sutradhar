<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-dark) 100%);">
    <div class="max-w-md w-full card">
      <h1 class="text-3xl font-bold text-center mb-8" style="color: var(--theme-primary);">🎓 Welcome to Apex Academy</h1>

      <div v-if="error" class="mb-4 p-4 rounded-xl border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-if="magicLinkSent" class="mb-4 p-4 rounded-xl border border-green-500/30" style="background-color: rgba(34, 197, 94, 0.1); color: #16a34a;">
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
          <div class="w-full border-t" style="border-color: var(--theme-border);"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2" style="background-color: var(--theme-card); color: var(--theme-text-secondary);">Or</span>
        </div>
      </div>

      <!-- Magic Link Login -->
      <form @submit.prevent="handleMagicLink" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--theme-text);">Email</label>
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