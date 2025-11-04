<template>
  <div class="min-h-screen bg-halloween-bg">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold text-halloween-orange">💻 Coding Practice</h1>
        <NuxtLink to="/catalog" class="text-halloween-ghost/80 hover:text-halloween-orange hover:underline flex items-center gap-2">
          <span>←</span> Back to Catalog
        </NuxtLink>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-lg text-halloween-ghost/60">Loading assignments...</div>
      </div>

      <div v-else-if="error" class="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 mb-4">
        {{ error }}
      </div>

      <div v-else-if="assignments.length === 0" class="text-center py-12">
        <div class="text-2xl text-halloween-ghost/60 mb-4">No assignments available</div>
        <p class="text-halloween-ghost/40">Check back later for coding practice exercises!</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Course Filter -->
        <div class="card p-4">
          <label class="block text-sm font-semibold text-halloween-orange mb-2">Filter by Course:</label>
          <select
            v-model="selectedCourse"
            @change="loadAssignments"
            class="w-full md:w-64 bg-halloween-dark border border-halloween-orange/30 rounded-lg px-4 py-2 text-halloween-ghost focus:outline-none focus:border-halloween-orange focus:ring-2 focus:ring-halloween-orange/50"
          >
            <option value="">All Courses</option>
            <option v-for="course in courses" :key="course.slug" :value="course.slug">
              {{ course.title }}
            </option>
          </select>
        </div>

        <!-- Assignments Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div class="flex items-center justify-between text-sm text-halloween-ghost/60">
              <span v-if="assignment.courseSlug" class="capitalize">{{ assignment.courseSlug }}</span>
              <span class="text-halloween-orange">Start Practice →</span>
            </div>
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

const api = useApi()
const assignments = ref<any[]>([])
const courses = ref<any[]>([])
const selectedCourse = ref('')
const loading = ref(true)
const error = ref('')

const loadAssignments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.code.list(selectedCourse.value || undefined)
    if (response.ok && response.assignments) {
      assignments.value = response.assignments
    } else {
      error.value = response.error || 'Failed to load assignments'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load assignments'
  }
  
  loading.value = false
}

onMounted(async () => {
  // Load courses for filter
  try {
    const catalogResponse = await api.catalog.list()
    if (catalogResponse.ok && catalogResponse.courses) {
      courses.value = catalogResponse.courses
    }
  } catch (e) {
    // Non-fatal
  }
  
  // Load assignments
  await loadAssignments()
})

useHead({
  title: 'Coding Practice - Apex Academy',
})
</script>

