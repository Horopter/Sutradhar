<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-halloween-orange mb-8">Admin - Go Live</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Index Management</h2>
        <button @click="rebuildIndex" :disabled="rebuilding" class="btn-primary w-full mb-2">
          {{ rebuilding ? 'Rebuilding...' : 'Rebuild BM25 Index' }}
        </button>
        <p class="text-sm text-halloween-ghost/60">Rebuild search index from data_repository</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Image Cache</h2>
        <button @click="cacheImages" :disabled="caching" class="btn-primary w-full mb-2">
          {{ caching ? 'Caching...' : 'Cache Images from Moss' }}
        </button>
        <p class="text-sm text-halloween-ghost/60">Prefetch images via Moss bridge</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Test Forum Post</h2>
        <button @click="testForumPost" :disabled="posting" class="btn-primary w-full mb-2">
          {{ posting ? 'Posting...' : 'Post to Forum (Browser Use)' }}
        </button>
        <p class="text-sm text-halloween-ghost/60">Test BrowserUse integration</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Test Email</h2>
        <button @click="testEmail" :disabled="sending" class="btn-primary w-full mb-2">
          {{ sending ? 'Sending...' : 'Send Test Escalation Email' }}
        </button>
        <p class="text-sm text-halloween-ghost/60">Test AgentMail (dry-run mode)</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold text-halloween-orange mb-4">Create Study Plan</h2>
        <button @click="createSamplePlan" :disabled="creating" class="btn-primary w-full mb-2">
          {{ creating ? 'Creating...' : 'Create Sample Calendar Plan' }}
        </button>
        <p class="text-sm text-halloween-ghost/60">Test Composio calendar integration</p>
      </div>
    </div>

    <div v-if="message" class="mt-6 card" :class="messageType === 'error' ? 'bg-red-500/20 border-red-500' : 'bg-green-500/20 border-green-500'">
      <p :class="messageType === 'error' ? 'text-red-400' : 'text-green-400'">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { post } = useApi()
const { sessionId } = useAuth()

const rebuilding = ref(false)
const caching = ref(false)
const posting = ref(false)
const sending = ref(false)
const creating = ref(false)
const message = ref('')
const messageType = ref('success')

function showMessage(msg: string, type?: string) {
  message.value = msg
  messageType.value = type || 'success'
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const rebuildIndex = async () => {
  rebuilding.value = true
  try {
    const result = await post('/admin/seed/index', {})
    if (result.ok) {
      showMessage('Index rebuilt successfully!', 'success')
    } else {
      showMessage('Failed to rebuild index', 'error')
    }
  } catch (error: any) {
    showMessage('Error: ' + error.message, 'error')
  } finally {
    rebuilding.value = false
  }
}

const cacheImages = async () => {
  caching.value = true
  try {
    const result = await post('/admin/images/cache', {})
    if (result.ok) {
      showMessage(`Cached images for ${result.cached?.length || 0} courses`, 'success')
    } else {
      showMessage('Failed to cache images', 'error')
    }
  } catch (error: any) {
    showMessage('Error: ' + error.message, 'error')
  } finally {
    caching.value = false
  }
}

const testForumPost = async () => {
  posting.value = true
  try {
    const result = await post('/assistant/forum', {
      sessionId: sessionId.value || 'admin-session',
      text: 'Test post from Apex Academy admin panel'
    })
    if (result.ok) {
      showMessage('Forum post sent!', 'success')
    } else {
      showMessage('Forum post failed', 'error')
    }
  } catch (error: any) {
    showMessage('Error: ' + error.message, 'error')
  } finally {
    posting.value = false
  }
}

const testEmail = async () => {
  sending.value = true
  try {
    const result = await post('/assistant/escalate', {
      sessionId: sessionId.value || 'admin-session',
      reason: 'Test escalation from admin panel'
    })
    if (result.ok) {
      showMessage('Email draft created!', 'success')
    } else {
      showMessage('Email failed', 'error')
    }
  } catch (error: any) {
    showMessage('Error: ' + error.message, 'error')
  } finally {
    sending.value = false
  }
}

const createSamplePlan = async () => {
  creating.value = true
  try {
    const result = await post('/schedule/study', {
      userId: 'admin',
      sessionId: sessionId.value || 'admin-session'
    })
    if (result.ok) {
      showMessage('Study plan created!', 'success')
    } else {
      showMessage('Failed to create plan', 'error')
    }
  } catch (error: any) {
    showMessage('Error: ' + error.message, 'error')
  } finally {
    creating.value = false
  }
}

useHead({
  title: 'Admin - Apex Academy'
})
</script>

