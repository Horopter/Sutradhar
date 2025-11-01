<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading quiz...</p>
    </div>

    <div v-else-if="error" class="card bg-red-500/20 border-red-500">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold text-halloween-orange mb-6">{{ quiz?.title || 'Quiz' }}</h1>

      <div v-if="!started" class="card">
        <p class="mb-4">{{ questions.length }} questions</p>
        <button @click="startQuiz" class="btn-primary w-full">Start Quiz</button>
      </div>

      <div v-else-if="!finished">
        <div class="card mb-4">
          <div class="flex justify-between items-center">
            <span>Question {{ currentQuestion + 1 }} of {{ questions.length }}</span>
            <span>Time: {{ formatTime(elapsedTime) }}</span>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-bold mb-4">{{ questions[currentQuestion].question }}</h2>
          <div class="space-y-3">
            <label
              v-for="(option, idx) in questions[currentQuestion].options"
              :key="idx"
              class="flex items-center p-4 bg-halloween-dark rounded-lg cursor-pointer hover:bg-halloween-card transition"
              :class="answers[currentQuestion] === idx ? 'border-2 border-halloween-orange' : 'border-2 border-transparent'"
            >
              <input
                type="radio"
                :value="idx"
                v-model="answers[currentQuestion]"
                class="mr-3"
              />
              <span>{{ option }}</span>
            </label>
          </div>

          <div class="flex justify-between mt-6">
            <button
              @click="previousQuestion"
              :disabled="currentQuestion === 0"
              class="btn-secondary"
            >
              Previous
            </button>
            <button
              v-if="currentQuestion < questions.length - 1"
              @click="nextQuestion"
              class="btn-primary"
            >
              Next
            </button>
            <button
              v-else
              @click="submitQuiz"
              class="btn-primary"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card">
        <h2 class="text-3xl font-bold text-halloween-orange mb-4">Results</h2>
        <div class="text-4xl font-bold mb-4">{{ score }}%</div>
        <div class="mb-4">
          <span :class="passed ? 'text-green-400' : 'text-red-400'" class="text-xl font-bold">
            {{ passed ? '✅ Passed' : '❌ Failed' }}
          </span>
        </div>
        <p class="text-halloween-ghost/70">You got {{ correctAnswers }} out of {{ questions.length }} correct.</p>
        <NuxtLink to="/subjects" class="btn-primary mt-6 inline-block">Back to Subjects</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const id = computed(() => route.params.id as string)

const quiz = ref(null)
const questions = ref([])
const answers = ref([])
const started = ref(false)
const finished = ref(false)
const currentQuestion = ref(0)
const startTime = ref(0)
const elapsedTime = ref(0)
const score = ref(0)
const correctAnswers = ref(0)
const passed = ref(false)
const loading = ref(true)
const error = ref('')

const { user } = useAuth()
const { get, post } = useApi()

let timer: any = null

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startQuiz = () => {
  started.value = true
  startTime.value = Date.now()
  timer = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
}

const nextQuestion = () => {
  if (currentQuestion.value < questions.value.length - 1) {
    currentQuestion.value++
  }
}

const previousQuestion = () => {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

const submitQuiz = async () => {
  finished.value = true
  if (timer) clearInterval(timer)

  try {
    const result = await post('/quiz/' + id.value + '/attempt', {
      userId: user.value?.id || 'guest',
      answers: answers.value,
      startedAt: startTime.value,
      finishedAt: Date.now()
    })

    if (result.ok) {
      score.value = result.score
      correctAnswers.value = result.correct
      passed.value = result.passed
    }
  } catch (err: any) {
    error.value = err.message
  }
}

onMounted(async () => {
  try {
    const result = await get<{ ok: boolean; quiz: any }>('/quiz/' + id.value)
    if (result.ok) {
      quiz.value = result.quiz
      questions.value = result.quiz.questions || []
      answers.value = new Array(questions.value.length).fill(null)
    } else {
      error.value = 'Quiz not found'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load quiz'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

useHead({
  title: 'Quiz - Apex Academy'
})
</script>

