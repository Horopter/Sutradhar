<template>
  <div>
    <button
      @click="isOpen = !isOpen"
      class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center text-xl sm:text-2xl z-40 animate-pulse-slow touch-manipulation"
      style="background-color: var(--theme-primary);"
      title="AI Assistant"
    >
      🎃
    </button>

    <div
      v-if="isOpen"
      class="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 left-2 sm:left-auto w-auto sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-none rounded-xl shadow-2xl z-50 p-4 sm:p-6"
      style="background-color: var(--theme-card); border: 1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent);"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg sm:text-xl font-bold" style="color: var(--theme-primary);">AI Assistant</h3>
        <button @click="isOpen = false" style="color: var(--theme-text-secondary);" class="hover:opacity-80 p-1 touch-manipulation" aria-label="Close">
          ✕
        </button>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div class="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 mb-3 sm:mb-4">
          <div v-for="msg in messages" :key="msg.id" :class="msg.from === 'user' ? 'text-right' : 'text-left'">
            <div 
              class="p-2 sm:p-3 rounded-lg inline-block max-w-[85%] sm:max-w-[80%] text-sm sm:text-base break-words"
              :style="msg.from === 'user' 
                ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', color: 'var(--theme-text)' }
                : { backgroundColor: 'var(--theme-dark)', color: 'var(--theme-text)' }"
            >
              {{ msg.text }}
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <input
            v-model="question"
            @keyup.enter="askQuestion"
            type="text"
            placeholder="Ask a question..."
            class="flex-1 input-field text-sm sm:text-base"
          />
          <button @click="askQuestion" :disabled="loading || !question.trim()" class="btn-primary w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3 touch-manipulation">
            {{ loading ? '...' : 'Ask' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

