<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <NuxtLink :to="courseSlug ? `/course/${courseSlug}` : '/catalog'" class="text-halloween-orange hover:text-halloween-pumpkin hover:underline mb-4 inline-block flex items-center gap-2">
        <span>←</span> Back
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading lesson...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
        {{ error }}
      </div>

      <div v-else-if="lesson" class="card">
        <h1 class="text-4xl font-bold mb-4 text-halloween-orange">{{ lesson.title }}</h1>
        <div v-if="lesson.description" class="text-xl text-halloween-ghost/80 mb-6">{{ lesson.description }}</div>
        <div v-if="lesson.content" class="prose prose-invert max-w-none prose-headings:text-halloween-orange prose-a:text-halloween-pumpkin prose-strong:text-halloween-orange prose-code:text-halloween-lime" v-html="lesson.content"></div>
        <div v-else class="text-halloween-ghost/60">No content available</div>
      </div>
      
      <!-- Floating Voice Assistant Button -->
      <LessonVoiceButton 
        v-if="lesson && courseSlug" 
        :lesson-id="lessonId" 
        :course-slug="courseSlug"
        :lesson-url="lessonUrl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const api = useApi()
const { sessionId } = useAuth()

const lessonId = route.params.id as string
const courseSlug = route.query.courseSlug as string
const lesson = ref<any>(null)
const loading = ref(true)
const error = ref('')
const lessonUrl = computed(() => typeof window !== 'undefined' ? window.location.href : '')

onMounted(async () => {
  loading.value = true
  const response = await api.catalog.getLesson(lessonId, sessionId.value || undefined, courseSlug)
  if (response.ok && response.lesson) {
    lesson.value = response.lesson
  } else {
    error.value = response.error || 'Failed to load lesson'
  }
  loading.value = false
})

useHead({
  title: lesson.value ? `${lesson.value.title} - Apex Academy` : 'Lesson - Apex Academy',
})
</script>