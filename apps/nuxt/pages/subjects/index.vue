<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-halloween-orange mb-8">Subjects</h1>
    
    <div v-if="loading" class="text-center py-12">
      <p class="text-halloween-ghost/60">Loading subjects...</p>
    </div>

    <div v-else-if="error" class="card bg-red-500/20 border-red-500">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="subject in subjects"
        :key="subject.slug"
        :to="`/subjects/${subject.slug}`"
        class="card hover:scale-105 transition-transform"
      >
        <h2 class="text-2xl font-bold text-halloween-orange mb-2">{{ subject.title }}</h2>
        <p class="text-halloween-ghost/70 mb-4">{{ subject.description }}</p>
        <div class="flex items-center text-sm text-halloween-ghost/60">
          <span>{{ subject.lessonCount || 0 }} lessons</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
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

