<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <NuxtLink to="/catalog" class="text-halloween-orange hover:text-halloween-pumpkin hover:underline mb-4 inline-block flex items-center gap-2">
        <span>←</span> Back to Catalog
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading quiz...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
        {{ error }}
      </div>

      <div v-else-if="quiz">
        <div class="card">
          <h1 class="text-3xl font-bold mb-6 text-halloween-orange">{{ quiz.title }}</h1>

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div
              v-for="(question, index) in quiz.questions"
              :key="question.id"
              class="border-b border-halloween-orange/20 pb-6 last:border-0"
            >
              <h3 class="text-lg font-semibold mb-4 text-halloween-ghost">{{ index + 1 }}. {{ question.question }}</h3>
              <div class="space-y-2">
                <label
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="flex items-center p-3 border border-halloween-orange/30 rounded-lg hover:bg-halloween-dark hover:border-halloween-orange/50 cursor-pointer transition"
                >
                  <input
                    type="radio"
                    :name="`question-${question.id}`"
                    :value="optIndex"
                    v-model="answers[question.id]"
                    class="mr-3 accent-halloween-orange"
                  />
                  <span class="text-halloween-ghost">{{ option }}</span>
                </label>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                type="submit"
                :disabled="submitting || !allAnswered"
                class="btn-primary disabled:opacity-50"
              >
                {{ submitting ? 'Submitting...' : 'Submit Quiz' }}
              </button>
            </div>
          </form>
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
const router = useRouter()
const api = useApi()
const { user } = useAuth()

const quizId = route.params.id as string
const quiz = ref<any>(null)
const answers = ref<Record<string, number>>({})
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const startTime = ref(Date.now())

const allAnswered = computed(() => {
  if (!quiz.value) return false
  return quiz.value.questions.every((q: any) => answers.value[q.id] !== undefined)
})

onMounted(async () => {
  loading.value = true
  const response = await api.quiz.get(quizId)
  if (response.ok && response.quiz) {
    quiz.value = response.quiz
  } else {
    error.value = response.error || 'Failed to load quiz'
  }
  loading.value = false
})

const handleSubmit = async () => {
  if (!quiz.value || !user.value) return

  submitting.value = true
  const answerArray = quiz.value.questions.map((q: any) => ({
    questionId: q.id,
    answer: answers.value[q.id],
  }))

  const response = await api.quiz.submit(
    quizId,
    user.value.userId,
    answerArray,
    startTime.value,
    Date.now()
  )

  if (response.ok) {
    router.push(`/quiz/${quizId}/results`)
  } else {
    error.value = response.error || 'Failed to submit quiz'
  }
  submitting.value = false
}

useHead({
  title: quiz.value ? `${quiz.value.title} - Apex Academy` : 'Quiz - Apex Academy',
})
</script>