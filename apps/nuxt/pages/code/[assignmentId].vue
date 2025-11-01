<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading assignment...</p>
    </div>

    <div v-else-if="error" class="card bg-red-500/20 border-red-500">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold text-halloween-orange mb-4">{{ assignment?.title || 'Coding Assignment' }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Instructions -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Instructions</h2>
          <div class="prose prose-invert max-w-none">
            <p class="whitespace-pre-wrap">{{ assignment?.prompt }}</p>
          </div>

          <div v-if="assignment?.starterCode" class="mt-4">
            <h3 class="font-bold mb-2">Starter Code:</h3>
            <pre class="bg-halloween-dark p-4 rounded-lg overflow-x-auto"><code>{{ assignment.starterCode }}</code></pre>
          </div>
        </div>

        <!-- Code Editor -->
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Code Editor</h2>
            <span class="text-sm text-halloween-ghost/60">{{ assignment?.language || 'javascript' }}</span>
          </div>

          <textarea
            v-model="code"
            class="w-full h-64 font-mono text-sm bg-halloween-dark border border-halloween-orange/30 rounded-lg p-4 text-halloween-ghost resize-none"
            placeholder="Write your code here..."
          ></textarea>

          <div class="flex space-x-2 mt-4">
            <button @click="runCode" :disabled="running" class="btn-primary flex-1">
              {{ running ? 'Running...' : 'Run Tests' }}
            </button>
            <button @click="getHint" :disabled="gettingHint" class="btn-secondary">
              {{ gettingHint ? '...' : '💡 Hint' }}
            </button>
          </div>

          <!-- Results -->
          <div v-if="results" class="mt-4 p-4 rounded-lg" :class="results.passed === results.total ? 'bg-green-500/20 border border-green-500' : 'bg-yellow-500/20 border border-yellow-500'">
            <div class="font-bold mb-2">
              Tests: {{ results.passed }}/{{ results.total }} passed
            </div>
            <div v-if="results.cases" class="space-y-1 text-sm">
              <div v-for="(testCase, idx) in results.cases" :key="idx" class="flex items-center">
                <span :class="testCase.passed ? 'text-green-400' : 'text-red-400'">
                  {{ testCase.passed ? '✅' : '❌' }}
                </span>
                <span class="ml-2">{{ testCase.name }}</span>
              </div>
            </div>
          </div>

          <!-- Hint -->
          <div v-if="hint" class="mt-4 p-4 bg-halloween-orange/20 border border-halloween-orange/30 rounded-lg">
            <h3 class="font-bold mb-2 text-halloween-orange">💡 Hint</h3>
            <p class="text-sm whitespace-pre-wrap">{{ hint }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const assignmentId = computed(() => route.params.assignmentId as string)

const assignment = ref(null)
const code = ref('')
const results = ref(null)
const hint = ref('')
const running = ref(false)
const gettingHint = ref(false)
const loading = ref(true)
const error = ref('')

const { user, sessionId } = useAuth()
const { get, post } = useApi()

const runCode = async () => {
  running.value = true
  results.value = null
  try {
    const result = await post('/code/' + assignmentId.value + '/run', {
      code: code.value,
      language: assignment.value?.language || 'javascript'
    })
    if (result.ok) {
      results.value = result
    } else {
      error.value = result.error || 'Failed to run code'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to run code'
  } finally {
    running.value = false
  }
}

const getHint = async () => {
  gettingHint.value = true
  hint.value = ''
  try {
    const result = await post('/code/' + assignmentId.value + '/hint', {
      code: code.value,
      sessionId: sessionId.value || 'demo-session'
    })
    if (result.ok) {
      hint.value = result.hint
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to get hint'
  } finally {
    gettingHint.value = false
  }
}

onMounted(async () => {
  try {
    const result = await get<{ ok: boolean; assignment: any }>('/code/' + assignmentId.value)
    if (result.ok) {
      assignment.value = result.assignment
      code.value = result.assignment.starterCode || ''
    } else {
      error.value = 'Assignment not found'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load assignment'
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Coding Assignment - Apex Academy'
})
</script>

