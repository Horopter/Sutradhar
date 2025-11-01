<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8">
      <NuxtLink to="/catalog" class="text-halloween-orange hover:text-halloween-pumpkin hover:underline mb-4 inline-block flex items-center gap-2">
        <span>←</span> Back to Catalog
      </NuxtLink>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
        {{ error }}
      </div>

      <div v-else-if="lessons.length === 0" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">No lessons available</div>
      </div>

      <div v-else>
        <h1 class="text-4xl font-bold mb-8 text-halloween-orange capitalize">{{ courseSlug }}</h1>
        <div class="grid gap-4">
          <NuxtLink
            v-for="lesson in lessons"
            :key="lesson.id"
            :to="`/lesson/${lesson.id}?courseSlug=${courseSlug}`"
            class="card hover:border-halloween-orange hover:shadow-halloween-orange/30"
          >
            <h3 class="text-xl font-semibold mb-2 text-halloween-orange">{{ lesson.title }}</h3>
            <p v-if="lesson.description" class="text-halloween-ghost/80">{{ lesson.description }}</p>
          </NuxtLink>
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
const lessons = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
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
