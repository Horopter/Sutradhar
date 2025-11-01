<template>
  <div class="max-w-md mx-auto px-4 py-12">
    <div class="card">
      <h1 class="text-3xl font-bold text-halloween-orange mb-6 text-center">Login</h1>

      <div class="space-y-4">
        <button @click="handleGuestLogin" :disabled="loading" class="w-full btn-primary">
          {{ loading ? 'Loading...' : 'Continue as Guest' }}
        </button>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-halloween-orange/30"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-halloween-card text-halloween-ghost/60">Or</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-halloween-ghost mb-2">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="input-field"
          />
        </div>

        <button @click="handleMagicLink" :disabled="loading || !email" class="w-full btn-secondary">
          {{ loading ? 'Sending...' : 'Email me a magic link' }}
        </button>

        <div v-if="magicLinkSent" class="p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p class="text-green-400">Magic link sent! Check your email.</p>
        </div>

        <div v-if="error" class="p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <p class="text-red-400">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const email = ref('')
const loading = ref(false)
const magicLinkSent = ref(false)
const error = ref('')

const { loginAsGuest, sendMagicLink } = useAuth()
const router = useRouter()

const handleGuestLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await loginAsGuest()
    if (result.ok) {
      router.push('/subjects')
    } else {
      error.value = result.error || 'Failed to login'
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleMagicLink = async () => {
  if (!email.value) return
  loading.value = true
  error.value = ''
  magicLinkSent.value = false
  try {
    const result = await sendMagicLink(email.value)
    if (result.ok) {
      magicLinkSent.value = true
    } else {
      error.value = result.error || 'Failed to send magic link'
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Login - Apex Academy'
})
</script>

