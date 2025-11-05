<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8">
      <NuxtLink to="/catalog" class="mb-4 inline-block flex items-center gap-2 hover:underline" style="color: var(--theme-primary);">
        <span>←</span> Back to Catalog
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else-if="lessons.length === 0" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">No lessons available</div>
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold capitalize" style="color: var(--theme-primary);">{{ course?.title || courseSlug }}</h1>
          <NuxtLink
            :to="`/assignments/${courseSlug}`"
            class="btn-secondary flex items-center gap-2"
          >
            💻 Coding Practice
          </NuxtLink>
        </div>
        
        <div class="mb-6">
          <h2 class="text-2xl font-semibold mb-4" style="color: var(--theme-text);">Lessons</h2>
          <div class="grid gap-4">
            <NuxtLink
              v-for="lesson in lessons"
              :key="lesson.id"
              :to="`/lesson/${lesson.id}?courseSlug=${courseSlug}`"
              class="card"
            >
              <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">{{ lesson.title }}</h3>
              <p v-if="lesson.description" style="color: var(--theme-text-secondary);">{{ lesson.description }}</p>
            </NuxtLink>
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
const { sessionId } = useAuth()

const courseSlug = route.params.slug as string
const course = ref<any>(null) // Store course info if available
const lessons = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  
  // Try to get course info from catalog
  try {
    const catalogResponse = await api.catalog.list()
    if (catalogResponse.ok && catalogResponse.courses) {
      const foundCourse = catalogResponse.courses.find((c: any) => c.slug === courseSlug)
      if (foundCourse) {
        course.value = foundCourse
      }
    }
  } catch (e) {
    // Non-fatal - just use slug if course not found
  }
  
  // Get lessons
  const response = await api.catalog.getLessons(courseSlug)
  if (response.ok && response.lessons) {
    lessons.value = response.lessons
  } else {
    error.value = response.error || 'Failed to load lessons'
  }
  loading.value = false
})

useHead({
  title: `${courseSlug} - Apex Academy`,
})
</script>
