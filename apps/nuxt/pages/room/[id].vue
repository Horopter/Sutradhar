<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-bold text-halloween-orange mb-6">Study Room: {{ id }}</h1>

    <div v-if="!connected" class="card text-center">
      <p class="mb-4">Join the live study room</p>
      <button @click="connect" :disabled="connecting" class="btn-primary">
        {{ connecting ? 'Connecting...' : 'Join Room' }}
      </button>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card">
        <h2 class="text-xl font-bold mb-4">Study Room</h2>
        <div class="bg-halloween-dark p-4 rounded-lg mb-4">
          <p class="text-halloween-ghost/70">Voice room connected. Use your browser's audio controls to manage microphone.</p>
          <p v-if="agenda" class="mt-4 text-halloween-ghost">{{ agenda }}</p>
        </div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4">Participants</h2>
        <div class="space-y-2">
          <div v-for="participant in participants" :key="participant" class="p-2 bg-halloween-dark rounded">
            {{ participant }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  title: `Room ${id.value} - Apex Academy`
})
</script>

