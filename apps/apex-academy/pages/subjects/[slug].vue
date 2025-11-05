<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-halloween-bg">
    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading...</p>
    </div>

    <div v-else-if="error" class="card bg-red-500/20 border-red-500">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else>
      <h1 class="text-4xl font-bold text-halloween-orange mb-8">{{ course?.title || slug.charAt(0).toUpperCase() + slug.slice(1) }}</h1>

      <div class="flex items-center justify-between mb-8">
        <div class="flex space-x-2 border-b border-halloween-orange/30">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'border-b-2 border-halloween-orange text-halloween-orange' : 'text-halloween-ghost/60'"
            class="px-4 py-2 font-medium"
          >
            {{ tab }}
          </button>
        </div>
        <NuxtLink
          :to="`/assignments/${slug}`"
          class="btn-secondary flex items-center gap-2"
        >
          💻 Coding Practice
        </NuxtLink>
      </div>

      <!-- Lessons Tab -->
      <div v-if="activeTab === 'Lessons'" class="space-y-4">
        <div v-for="lesson in lessons" :key="lesson.id" class="card hover:scale-105 transition-transform">
          <NuxtLink :to="`/lesson/${lesson.id}?courseSlug=${slug}`" class="block">
            <h2 class="text-xl font-bold text-halloween-orange mb-2">{{ lesson.title }}</h2>
            <p v-if="lesson.description" class="text-halloween-ghost/70">{{ lesson.description }}</p>
          </NuxtLink>
        </div>
      </div>

      <!-- Quizzes Tab -->
      <div v-if="activeTab === 'Quizzes'" class="space-y-4">
        <p v-if="quizzes.length === 0" class="text-halloween-ghost/60">No quizzes available yet.</p>
        <div v-for="quiz in quizzes" :key="quiz.quizId" class="card hover:scale-105 transition-transform">
          <NuxtLink :to="`/quiz/${quiz.quizId}`" class="block">
            <h2 class="text-xl font-bold text-halloween-orange mb-2">{{ quiz.title }}</h2>
          </NuxtLink>
        </div>
      </div>

      <!-- Images Tab -->
      <div v-if="activeTab === 'Images'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="img in images" :key="img.url" class="card p-0 overflow-hidden">
          <img :src="img.url" :alt="img.caption" class="w-full h-48 object-cover" />
          <div class="p-4">
            <p class="text-sm text-halloween-ghost/70">{{ img.caption }}</p>
            <span class="text-xs text-halloween-orange/60">{{ img.source }}</span>
          </div>
        </div>
        <div v-if="images.length === 0" class="col-span-full text-center text-halloween-ghost/60">
          No images available.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const course = ref(null)
const lessons = ref([])
const quizzes = ref([])
const images = ref([])
const activeTab = ref('Lessons')
const tabs = ['Lessons', 'Quizzes', 'Images']
const loading = ref(true)
const error = ref('')

const { get } = useApi()

onMounted(async () => {
  try {
    // Try to get course info from catalog
    const catalogResult = await get<{ ok: boolean; courses: any[] }>('/catalog')
    if (catalogResult.ok && catalogResult.courses) {
      const foundCourse = catalogResult.courses.find((c: any) => c.slug === slug.value)
      if (foundCourse) {
        course.value = foundCourse
      }
    }
    
    // Load lessons
    const lessonsResult = await get<{ ok: boolean; lessons: any[] }>(`/course/${slug.value}/lessons`)
    if (lessonsResult.ok) {
      lessons.value = lessonsResult.lessons || []
    }

    // Load images
    const imagesResult = await get<{ ok: boolean; images: any[] }>(`/course/${slug.value}/images`)
    if (imagesResult.ok) {
      images.value = imagesResult.images || []
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load course data'
  } finally {
    loading.value = false
  }
})

useHead({
  title: `${slug.value} - Apex Academy`
})
</script>

