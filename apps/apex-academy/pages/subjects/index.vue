<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen" style="background-color: var(--theme-bg);">
    <h1 class="text-4xl font-bold mb-8" style="color: var(--theme-primary);">📚 Subjects</h1>
    
    <div v-if="loading" class="text-center py-12">
      <p style="color: var(--theme-text-secondary);">Loading subjects...</p>
    </div>

    <div v-else-if="error" class="card rounded-xl border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
      <p>{{ error }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="subject in subjects"
        :key="subject.slug"
        :to="`/subjects/${subject.slug}`"
        class="card hover:scale-105 transition-transform"
      >
        <h2 class="text-2xl font-bold mb-2" style="color: var(--theme-primary);">{{ subject.title }}</h2>
        <p class="mb-4" style="color: var(--theme-text-secondary);">{{ subject.description }}</p>
        <div class="flex items-center text-sm" style="color: var(--theme-text-secondary); opacity: 0.7;">
          <span>{{ subject.lessonCount || 0 }} lessons</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const subjects = ref<Array<{ slug: string; title: string; description: string; lessonCount?: number }>>([])
const loading = ref(true)
const error = ref('')

const { get } = useApi()

onMounted(async () => {
  try {
    const result = await get<{ ok: boolean; courses: any[] }>('/catalog')
    if (result.ok) {
      subjects.value = result.courses || []
    } else {
      error.value = 'Failed to load subjects'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load subjects'
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Subjects - Apex Academy'
})
</script>

