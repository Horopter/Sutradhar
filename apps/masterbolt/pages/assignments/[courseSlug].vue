<template>
  <div class="min-h-screen" style="background-color: var(--theme-bg);">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <div>
          <NuxtLink to="/assignments" class="mb-2 inline-block flex items-center gap-2 hover:underline" style="color: var(--theme-text-secondary);">
            <span>←</span> All Assignments
          </NuxtLink>
          <h1 class="text-4xl font-bold" style="color: var(--theme-primary);">
            💻 Coding Practice - {{ course?.title || courseSlug }}
          </h1>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg" style="color: var(--theme-text-secondary);">Loading assignments...</div>
      </div>

      <div v-else-if="error" class="rounded-xl border border-red-500/30 p-4 mb-4" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        {{ error }}
      </div>

      <div v-else-if="assignments.length === 0" class="text-center py-12">
        <div class="text-2xl mb-4" style="color: var(--theme-text-secondary);">No assignments available for this course</div>
        <p style="color: var(--theme-text-secondary); opacity: 0.7;">Check back later for coding practice exercises!</p>
        <NuxtLink
          :to="`/subjects/${courseSlug}`"
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
          class="card transition-all duration-300"
        >
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-xl font-semibold flex-1" style="color: var(--theme-primary);">{{ assignment.title }}</h3>
            <span class="ml-2 px-2 py-1 rounded text-xs uppercase" style="background-color: var(--theme-dark); border: 1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent); color: var(--theme-text-secondary);">
              {{ assignment.language || 'code' }}
            </span>
          </div>
          <p v-if="assignment.description || assignment.prompt" class="text-sm mb-4 line-clamp-3" style="color: var(--theme-text-secondary);">
            {{ assignment.description || (assignment.prompt?.substring(0, 150) + '...') }}
          </p>
          <div class="flex items-center justify-end text-sm">
            <span style="color: var(--theme-primary);">Start Practice →</span>
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
  title: `${courseSlug} Coding Practice - Masterbolt`,
})
</script>

