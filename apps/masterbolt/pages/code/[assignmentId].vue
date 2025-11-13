<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <NuxtLink to="/catalog" class="mb-4 inline-block flex items-center gap-2 hover:underline" style="color: var(--theme-primary);">
        <span>←</span> Back to Catalog
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading assignment...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4 mb-4" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else-if="assignment" class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h1 class="text-2xl font-bold mb-4" style="color: var(--theme-primary);">{{ assignment.title }}</h1>
          <div class="prose max-w-none mb-6" style="color: var(--theme-text);">
            <p style="color: var(--theme-text-secondary);">{{ assignment.description }}</p>
            <div class="p-4 rounded-lg mt-4" style="background-color: var(--theme-dark); border: 1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent);">
              <strong style="color: var(--theme-primary);">Prompt:</strong>
              <pre class="mt-2 whitespace-pre-wrap" style="color: var(--theme-text-secondary);">{{ assignment.prompt }}</pre>
            </div>
          </div>

          <div class="flex gap-4 mb-4">
            <button
              @click="handleGetHint"
              :disabled="gettingHint"
              class="btn-primary"
            >
              {{ gettingHint ? 'Getting hint...' : '💡 Get Hint' }}
            </button>
            <button
              @click="handleRunCode"
              :disabled="running"
              class="px-4 py-2 rounded-lg transition disabled:opacity-50 font-semibold"
              style="background-color: #16a34a; color: white;"
              onmouseover="this.style.backgroundColor='#15803d'"
              onmouseout="this.style.backgroundColor='#16a34a'"
            >
              {{ running ? 'Running...' : '▶️ Run Code' }}
            </button>
          </div>

          <div v-if="hint" class="rounded-lg border border-yellow-500/30 p-4 mb-4" style="background-color: rgba(234, 179, 8, 0.1);">
            <strong style="color: #ca8a04;">💡 Hint:</strong>
            <p class="mt-2" style="color: #a16207;">{{ hint }}</p>
          </div>

          <div v-if="runResult" class="rounded-lg border border-blue-500/30 p-4" style="background-color: rgba(59, 130, 246, 0.1);">
            <strong style="color: #2563eb;">📋 Result:</strong>
            <pre class="mt-2 whitespace-pre-wrap" style="color: #1e40af;">{{ runResult }}</pre>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-semibold mb-4" style="color: var(--theme-primary);">💻 Code Editor</h2>
          <textarea
            v-model="code"
            class="w-full h-96 font-mono text-sm rounded-lg p-4 focus:outline-none focus:ring-2 transition"
            :placeholder="assignment.starterCode || `// Write your ${assignment.language} code here`"
            style="background-color: var(--theme-dark); border: 1.5px solid color-mix(in srgb, var(--theme-primary) 30%, transparent); color: var(--theme-text); --tw-ring-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
            @focus="$event.target.style.borderColor = 'var(--theme-primary)'"
            @blur="$event.target.style.borderColor = 'color-mix(in srgb, var(--theme-primary) 30%, transparent)'"
          ></textarea>
          <div class="mt-4 text-sm" style="color: var(--theme-text-secondary);">
            Language: <span class="font-semibold" style="color: var(--theme-primary);">{{ assignment.language }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const api = useApi()
const { user, sessionId } = useAuth()

const assignmentId = route.params.assignmentId as string
const assignment = ref<any>(null)
const code = ref('')
const hint = ref('')
const runResult = ref('')
const loading = ref(true)
const gettingHint = ref(false)
const running = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  const response = await api.code.get(assignmentId)
  if (response.ok && response.assignment) {
    assignment.value = response.assignment
    code.value = response.assignment.starterCode || ''
  } else {
    error.value = response.error || 'Failed to load assignment'
  }
  loading.value = false
})

const handleGetHint = async () => {
  if (!assignment.value || !code.value) return

  gettingHint.value = true
  hint.value = ''
  const response = await api.code.getHint(
    assignmentId,
    code.value,
    undefined,
    sessionId.value || undefined
  )

  if (response.ok && response.hint) {
    hint.value = response.hint
  } else {
    error.value = response.error || 'Failed to get hint'
  }
  gettingHint.value = false
}

const handleRunCode = async () => {
  if (!assignment.value || !code.value) return

  running.value = true
  runResult.value = ''
  const response = await api.code.run(assignmentId, code.value, assignment.value.language)

  if (response.ok) {
    runResult.value = response.output || response.result || 'Code executed successfully'
  } else {
    runResult.value = `Error: ${response.error || 'Failed to run code'}`
  }
  running.value = false
}

useHead({
  title: assignment.value ? `${assignment.value.title} - Masterbolt` : 'Code Assignment - Masterbolt',
})
</script>