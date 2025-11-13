<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <NuxtLink :to="courseSlug ? `/subjects/${courseSlug}` : '/catalog'" class="mb-4 inline-block flex items-center gap-2 hover:underline" style="color: var(--theme-primary);">
        <span>←</span> Back
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading lesson...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else-if="lesson" class="card">
        <h1 class="text-4xl font-bold mb-4" style="color: var(--theme-primary);">{{ lesson.title }}</h1>
        <div v-if="lesson.description" class="text-xl mb-6" style="color: var(--theme-text-secondary);">{{ lesson.description }}</div>
        <div v-if="lesson.content" class="prose max-w-none" :style="{ '--prose-headings': 'var(--theme-primary)', '--prose-links': 'var(--theme-primary)', '--prose-strong': 'var(--theme-primary)', color: 'var(--theme-text)' }" v-html="lesson.content"></div>
        <div v-else style="color: var(--theme-text-secondary);">No content available</div>
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
  title: lesson.value ? `${lesson.value.title} - Masterbolt` : 'Lesson - Masterbolt',
})
</script>