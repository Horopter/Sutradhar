<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style="background-color: var(--theme-bg); min-height: 100vh;">
    <h1 class="text-3xl font-bold mb-6" style="color: var(--theme-primary);">Study Room: {{ id }}</h1>

    <div v-if="!connected" class="card text-center">
      <p class="mb-4" style="color: var(--theme-text);">Join the live study room</p>
      <button @click="connect" :disabled="connecting" class="btn-primary">
        {{ connecting ? 'Connecting...' : 'Join Room' }}
      </button>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card">
        <h2 class="text-xl font-bold mb-4" style="color: var(--theme-text);">Study Room</h2>
        <div class="p-4 rounded-lg mb-4" style="background-color: var(--theme-dark);">
          <p style="color: var(--theme-text-secondary);">Voice room connected. Use your browser's audio controls to manage microphone.</p>
          <p v-if="agenda" class="mt-4" style="color: var(--theme-text);">{{ agenda }}</p>
        </div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4" style="color: var(--theme-text);">Participants</h2>
        <div class="space-y-2">
          <div v-for="participant in participants" :key="participant" class="p-2 rounded" style="background-color: var(--theme-dark); color: var(--theme-text);">
            {{ participant }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id as string)

const connected = ref(false)
const connecting = ref(false)
const participants = ref(['You'])
const agenda = ref('')

const { user, sessionId } = useAuth()
const { get } = useApi()

const connect = async () => {
  connecting.value = true
  try {
    const result = await get<{ ok: boolean; token: string; agenda: string }>('/room/' + id.value + '/join', {
      userId: user.value?.id || 'anonymous'
    })
    if (result.ok) {
      connected.value = true
      agenda.value = result.agenda
      // In production, use LiveKit SDK to connect
      console.log('Token received:', result.token)
    }
  } catch (err: any) {
    console.error('Failed to connect', err)
  } finally {
    connecting.value = false
  }
}

useHead({
  title: `Room ${id.value} - Masterbolt`
})
</script>

