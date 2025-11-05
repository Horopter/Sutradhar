<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <div>
          <NuxtLink to="/assignments" class="text-halloween-ghost/80 hover:text-halloween-orange hover:underline flex items-center gap-2 mb-2">
            <span>←</span> All Assignments
          </NuxtLink>
          <h1 class="text-4xl font-bold text-halloween-orange">
            💻 Coding Practice - {{ course?.title || courseSlug }}
          </h1>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading assignments...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 mb-4">
        {{ error }}
      </div>

      <div v-else-if="assignments.length === 0" class="text-center py-12">
        <div class="text-2xl text-halloween-ghost/60 mb-4">No assignments available for this course</div>
        <p class="text-halloween-ghost/40">Check back later for coding practice exercises!</p>
        <NuxtLink
          :to="`/course/${courseSlug}`"
          class="mt-4 inline-block btn-secondary"
        >
          View Course Lessons
        </NuxtLink>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="assignment in assignments"
          :key="assignment.assignmentId || assignment.id"
          :to="`/code/${assignment.assignmentId || assignment.id}`"
          class="card hover:border-halloween-orange hover:shadow-halloween-orange/30 transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-xl font-semibold text-halloween-orange flex-1">{{ assignment.title }}</h3>
            <span class="ml-2 px-2 py-1 bg-halloween-dark border border-halloween-orange/30 rounded text-xs text-halloween-ghost/80 uppercase">
              {{ assignment.language || 'code' }}
            </span>
          </div>
          <p v-if="assignment.description || assignment.prompt" class="text-halloween-ghost/80 text-sm mb-4 line-clamp-3">
            {{ assignment.description || (assignment.prompt?.substring(0, 150) + '...') }}
          </p>
          <div class="flex items-center justify-end text-sm">
            <span class="text-halloween-orange">Start Practice →</span>
          </div>
        </NuxtLink>
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

const courseSlug = route.params.courseSlug as string
const course = ref<any>(null)
const assignments = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  
  // Load course info
  try {
    const catalogResponse = await api.catalog.list()
    if (catalogResponse.ok && catalogResponse.courses) {
      const foundCourse = catalogResponse.courses.find((c: any) => c.slug === courseSlug)
      if (foundCourse) {
        course.value = foundCourse
      }
    }
  } catch (e) {
    // Non-fatal
  }
  
  // Load assignments for this course
  try {
    const response = await api.code.list(courseSlug)
    if (response.ok && response.assignments) {
      assignments.value = response.assignments
    } else {
      error.value = response.error || 'Failed to load assignments'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load assignments'
  }
  
  loading.value = false
})

useHead({
  title: `${courseSlug} Coding Practice - Apex Academy`,
})
</script>

