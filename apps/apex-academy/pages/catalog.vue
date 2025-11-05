<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold" style="color: var(--theme-primary);">📚 Course Catalog</h1>
        <div class="flex gap-3">
          <NuxtLink
            to="/assignments"
            class="btn-secondary"
          >
            💻 Coding Practice
          </NuxtLink>
          <NuxtLink
            to="/dashboard"
            class="btn-secondary"
          >
            Dashboard
          </NuxtLink>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading courses...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else-if="courses.length === 0" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">No courses available</div>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="course in courses"
          :key="course.slug"
          :to="`/course/${course.slug}`"
          class="card"
          :style="{ '--hover-border': 'var(--theme-primary)', '--hover-shadow': 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }"
        >
          <div v-if="course.image" class="mb-4">
            <img :src="course.image" :alt="course.title" class="w-full h-48 object-cover rounded-lg border" style="border-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);" />
          </div>
          <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">{{ course.title }}</h3>
          <p style="color: var(--theme-text-secondary);">{{ course.description }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const api = useApi()
const courses = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  const response = await api.catalog.list()
  if (response.ok && response.courses) {
    courses.value = response.courses
  } else {
    error.value = response.error || 'Failed to load courses'
  }
  loading.value = false
})

useHead({
  title: 'Course Catalog - Apex Academy',
})
</script>
