<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <NuxtLink to="/catalog" class="text-halloween-orange hover:text-halloween-pumpkin hover:underline mb-4 inline-block flex items-center gap-2">
        <span>←</span> Back to Catalog
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading assignment...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 mb-4">
        {{ error }}
      </div>

      <div v-else-if="assignment" class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h1 class="text-2xl font-bold mb-4 text-halloween-orange">{{ assignment.title }}</h1>
          <div class="prose prose-invert mb-6 prose-headings:text-halloween-orange prose-strong:text-halloween-orange">
            <p class="text-halloween-ghost/80">{{ assignment.description }}</p>
            <div class="bg-halloween-dark border border-halloween-orange/30 p-4 rounded-lg mt-4">
              <strong class="text-halloween-orange">Prompt:</strong>
              <pre class="mt-2 whitespace-pre-wrap text-halloween-ghost/80">{{ assignment.prompt }}</pre>
            </div>
          </div>

          <div class="flex gap-4 mb-4">
            <button
              @click="handleGetHint"
              :disabled="gettingHint"
              class="px-4 py-2 bg-halloween-orange/80 text-black rounded-lg hover:bg-halloween-pumpkin transition disabled:opacity-50 font-semibold"
            >
              {{ gettingHint ? 'Getting hint...' : '💡 Get Hint' }}
            </button>
            <button
              @click="handleRunCode"
              :disabled="running"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
            >
              {{ running ? 'Running...' : '▶️ Run Code' }}
            </button>
          </div>

          <div v-if="hint" class="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-4">
            <strong class="text-yellow-400">💡 Hint:</strong>
            <p class="mt-2 text-yellow-200">{{ hint }}</p>
          </div>

          <div v-if="runResult" class="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <strong class="text-blue-300">📋 Result:</strong>
            <pre class="mt-2 whitespace-pre-wrap text-blue-200">{{ runResult }}</pre>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-semibold mb-4 text-halloween-orange">💻 Code Editor</h2>
          <textarea
            v-model="code"
            class="w-full h-96 font-mono text-sm bg-halloween-dark border border-halloween-orange/30 rounded-lg p-4 text-halloween-ghost focus:outline-none focus:border-halloween-orange focus:ring-2 focus:ring-halloween-orange/50 placeholder-gray-500"
            :placeholder="assignment.starterCode || `// Write your ${assignment.language} code here`"
          ></textarea>
          <div class="mt-4 text-sm text-halloween-ghost/80">
            Language: <span class="font-semibold text-halloween-orange">{{ assignment.language }}</span>
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
  title: assignment.value ? `${assignment.value.title} - Apex Academy` : 'Code Assignment - Apex Academy',
})
</script>