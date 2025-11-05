<template>
  <div>
    <button
      @click="isOpen = !isOpen"
      class="fixed bottom-6 right-6 w-16 h-16 bg-halloween-orange rounded-full shadow-lg hover:shadow-halloween-orange/50 transition-all duration-300 hover:scale-110 flex items-center justify-center text-2xl z-40 animate-pulse-slow"
      title="Summon Sutradhar"
    >
      🎃
    </button>

    <div
      v-if="isOpen"
      class="fixed bottom-24 right-6 w-96 bg-halloween-card border border-halloween-orange/30 rounded-xl shadow-2xl z-50 p-6"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-halloween-orange">Sutradhar Assistant</h3>
        <button @click="isOpen = false" class="text-halloween-ghost/60 hover:text-halloween-ghost">
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <div class="max-h-64 overflow-y-auto space-y-2 mb-4">
          <div v-for="msg in messages" :key="msg.id" :class="msg.from === 'user' ? 'text-right' : 'text-left'">
            <div :class="msg.from === 'user' ? 'bg-halloween-orange/20' : 'bg-halloween-dark'" class="p-2 rounded-lg inline-block max-w-[80%]">
              {{ msg.text }}
            </div>
          </div>
        </div>

        <div class="flex space-x-2">
          <input
            v-model="question"
            @keyup.enter="askQuestion"
            type="text"
            placeholder="Ask a question..."
            class="flex-1 input-field"
          />
          <button @click="askQuestion" :disabled="loading || !question.trim()" class="btn-primary">
            {{ loading ? '...' : 'Ask' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false)
const question = ref('')
const messages = ref<Array<{ id: string; from: 'user' | 'agent'; text: string }>>([])
const loading = ref(false)

const { sessionId } = useAuth()
const { post } = useApi()

const askQuestion = async () => {
  if (!question.value.trim() || loading.value) return

  const userMsg = { id: Date.now().toString(), from: 'user' as const, text: question.value }
  messages.value.push(userMsg)
  const q = question.value
  question.value = ''
  loading.value = true

  try {
    const result = await post<{ ok: boolean; text: string }>('/assistant/answer', {
      sessionId: sessionId.value || 'demo-session',
      question: q
    })
    
    if (result.ok) {
      messages.value.push({
        id: (Date.now() + 1).toString(),
        from: 'agent',
        text: result.text
      })
    }
  } catch (error: any) {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      from: 'agent',
      text: 'Sorry, I encountered an error. Please try again.'
    })
  } finally {
    loading.value = false
  }
}
</script>

