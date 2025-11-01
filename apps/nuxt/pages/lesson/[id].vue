<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading lesson...</p>
    </div>

    <div v-else-if="error" class="card bg-red-500/20 border-red-500">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else>
      <div class="mb-8">
        <NuxtLink to="/subjects" class="text-halloween-orange hover:underline">← Back to Subjects</NuxtLink>
      </div>

      <div class="card prose prose-invert max-w-none">
        <h1 class="text-4xl font-bold text-halloween-orange mb-4">{{ lesson?.title || 'Lesson' }}</h1>
        <div v-html="renderedContent"></div>
      </div>

      <!-- Summon Sutradhar sidebar -->
      <div class="mt-8 card">
        <h3 class="text-xl font-bold text-halloween-orange mb-4">Need Help?</h3>
        <button @click="showSutradhar = true" class="btn-primary w-full">
          Summon Sutradhar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple markdown renderer - in production use a proper library
const marked = (text: string) => {
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-halloween-orange mt-6 mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-halloween-orange mt-5 mb-3">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code class="bg-halloween-dark px-2 py-1 rounded">$1</code>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-halloween-dark p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
    .replace(/\n/gim, '<br>')
}

const route = useRoute()
const id = computed(() => route.params.id as string)

const lesson = ref(null)
const loading = ref(true)
const error = ref('')
const showSutradhar = ref(false)

const { get } = useApi()

const renderedContent = computed(() => {
  if (!lesson.value?.body) return ''
  return marked(lesson.value.body)
})

onMounted(async () => {
  try {
    const result = await get<{ ok: boolean; lesson: any }>(`/lesson/${id.value}`, {
      sessionId: useAuth().sessionId.value || 'demo-session'
    })
    if (result.ok) {
      lesson.value = result.lesson
    } else {
      error.value = 'Lesson not found'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load lesson'
  } finally {
    loading.value = false
  }
})

useHead({
  title: `${lesson.value?.title || 'Lesson'} - Apex Academy`
})
</script>

