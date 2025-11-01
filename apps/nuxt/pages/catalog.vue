<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-halloween-orange">📚 Course Catalog</h1>
        <NuxtLink
          to="/dashboard"
          class="btn-secondary"
        >
          Dashboard
        </NuxtLink>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading courses...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
        {{ error }}
      </div>

      <div v-else-if="courses.length === 0" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">No courses available</div>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="course in courses"
          :key="course.slug"
          :to="`/course/${course.slug}`"
          class="card hover:border-halloween-orange hover:shadow-halloween-orange/30"
        >
          <div v-if="course.image" class="mb-4">
            <img :src="course.image" :alt="course.title" class="w-full h-48 object-cover rounded-lg border border-halloween-orange/20" />
          </div>
          <h3 class="text-xl font-semibold mb-2 text-halloween-orange">{{ course.title }}</h3>
          <p class="text-halloween-ghost/80">{{ course.description }}</p>
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
