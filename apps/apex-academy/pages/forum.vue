<template>
  <div class="min-h-screen" style="background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-dark) 100%);">
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold" style="color: var(--theme-primary);">💬 Forum</h1>
        <button 
          v-if="lessonId"
          @click="showNewPost = true"
          class="btn-primary"
        >
          New Post
        </button>
      </div>

      <!-- New Post Form -->
      <div v-if="showNewPost" class="card mb-6">
        <h2 class="text-xl font-semibold mb-4" style="color: var(--theme-primary);">Create New Post</h2>
        <form @submit.prevent="createPost">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--theme-text);">Title</label>
              <input 
                v-model="newPost.title"
                type="text"
                required
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--theme-text);">Content</label>
              <textarea 
                v-model="newPost.content"
                required
                rows="6"
                class="input-field"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" style="color: var(--theme-text);">Tags (comma-separated)</label>
              <input 
                v-model="newPost.tags"
                type="text"
                placeholder="help, question, discussion"
                class="input-field"
              />
            </div>
            <div class="flex gap-2">
              <button type="submit" class="btn-primary" :disabled="posting">
                {{ posting ? 'Posting...' : 'Post' }}
              </button>
              <button type="button" @click="showNewPost = false" class="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Posts List -->
      <div v-if="loading" class="text-center py-12">
        <div style="color: var(--theme-text);">Loading posts...</div>
      </div>

      <div v-else-if="error" class="card rounded-xl border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: #dc2626;">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="posts.length === 0" class="card text-center py-12">
        <p style="color: var(--theme-text-secondary);">No posts yet. Be the first to start a discussion!</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="post in posts" 
          :key="post._id || post.postId"
          class="card transition-colors cursor-pointer"
          @click="selectedPost = post"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-xl font-semibold mb-2" style="color: var(--theme-primary);">{{ post.title }}</h3>
              <p class="mb-3 line-clamp-2" style="color: var(--theme-text-secondary);">{{ post.content }}</p>
              <div class="flex items-center gap-4 text-sm" style="color: var(--theme-text-secondary); opacity: 0.7;">
                <span>{{ post.answerCount || 0 }} answers</span>
                <span>{{ post.upvotes || 0 }} upvotes</span>
                <span v-if="post.isAnswered" class="text-green-400">✓ Answered</span>
                <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
              </div>
              <div v-if="post.tags && post.tags.length > 0" class="flex gap-2 mt-2">
                <span 
                  v-for="tag in post.tags" 
                  :key="tag"
                  class="px-2 py-1 bg-gray-700 rounded text-xs"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Detail Modal -->
      <div 
        v-if="selectedPost" 
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="selectedPost = null"
      >
        <div class="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between mb-4">
            <h2 class="text-2xl font-bold" style="color: var(--theme-primary);">{{ selectedPost.title }}</h2>
            <button @click="selectedPost = null" class="text-2xl" style="color: var(--theme-text);">&times;</button>
          </div>
          
          <div class="prose max-w-none mb-6" style="color: var(--theme-text);">
            <p class="whitespace-pre-wrap">{{ selectedPost.content }}</p>
          </div>

          <div class="border-t pt-4 mb-4" style="border-color: var(--theme-border);">
            <h3 class="text-lg font-semibold mb-3" style="color: var(--theme-text);">Replies</h3>
            <div v-if="repliesLoading" class="text-center py-4">
              <div style="color: var(--theme-text);">Loading...</div>
            </div>
            <div v-else-if="replies.length === 0" class="text-center py-4" style="color: var(--theme-text-secondary);">
              No replies yet
            </div>
            <div v-else class="space-y-4">
              <div 
                v-for="reply in replies" 
                :key="reply._id || reply.replyId"
                class="p-4 rounded"
                style="background-color: var(--theme-dark);"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="text-sm" style="color: var(--theme-text-secondary);">
                    User {{ reply.userId?.substring(0, 8) }}
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm" style="color: var(--theme-text-secondary);">{{ reply.upvotes || 0 }} upvotes</span>
                    <button 
                      @click="upvoteReply(reply)"
                      style="color: var(--theme-primary);"
                      class="hover:opacity-80"
                    >
                      ↑
                    </button>
                  </div>
                </div>
                <p class="whitespace-pre-wrap" style="color: var(--theme-text);">{{ reply.content }}</p>
                <div v-if="reply.isAccepted" class="mt-2 text-sm" style="color: #16a34a;">
                  ✓ Accepted answer
                </div>
              </div>
            </div>
          </div>

          <form @submit.prevent="submitReply" class="border-t pt-4" style="border-color: var(--theme-border);">
            <textarea 
              v-model="replyContent"
              placeholder="Write a reply..."
              rows="4"
              required
              class="input-field mb-2"
            ></textarea>
            <button type="submit" class="btn-primary" :disabled="replying">
              {{ replying ? 'Posting...' : 'Reply' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user } = useAuth()
const api = useApi()

const lessonId = computed(() => route.query.lessonId as string)
const courseSlug = computed(() => route.query.courseSlug as string)

const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<any[]>([])
const showNewPost = ref(false)
const posting = ref(false)
const selectedPost = ref<any>(null)
const replies = ref<any[]>([])
const repliesLoading = ref(false)
const replyContent = ref('')
const replying = ref(false)

const newPost = ref({
  title: '',
  content: '',
  tags: ''
})

onMounted(async () => {
  if (!lessonId.value) {
    error.value = 'Lesson ID required'
    loading.value = false
    return
  }

  await loadPosts()
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await api.social.getPosts(lessonId.value)
    if (res.ok) {
      posts.value = res.posts || []
    } else {
      error.value = res.error || 'Failed to load posts'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

const createPost = async () => {
  if (!user.value?.userId || !courseSlug.value) return

  posting.value = true
  try {
    const tags = newPost.value.tags ? newPost.value.tags.split(',').map(t => t.trim()) : []
    const res = await api.social.createPost(
      user.value.userId,
      lessonId.value,
      courseSlug.value,
      newPost.value.title,
      newPost.value.content,
      tags
    )

    if (res.ok) {
      newPost.value = { title: '', content: '', tags: '' }
      showNewPost.value = false
      await loadPosts()
    } else {
      error.value = res.error || 'Failed to create post'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create post'
  } finally {
    posting.value = false
  }
}

watch(selectedPost, async (post) => {
  if (post) {
    repliesLoading.value = true
    try {
      const res = await api.social.getReplies(post._id || post.postId)
      if (res.ok) {
        replies.value = res.replies || []
      }
    } catch (err: any) {
      console.error('Failed to load replies:', err)
    } finally {
      repliesLoading.value = false
    }
  }
})

const submitReply = async () => {
  if (!user.value?.userId || !selectedPost.value) return

  replying.value = true
  try {
    const res = await api.social.replyToPost(
      selectedPost.value._id || selectedPost.value.postId,
      user.value.userId,
      replyContent.value
    )

    if (res.ok) {
      replyContent.value = ''
      await loadPosts()
      const repliesRes = await api.social.getReplies(selectedPost.value._id || selectedPost.value.postId)
      if (repliesRes.ok) {
        replies.value = repliesRes.replies || []
      }
    }
  } catch (err: any) {
    console.error('Failed to submit reply:', err)
  } finally {
    replying.value = false
  }
}

const upvoteReply = async (reply: any) => {
  if (!user.value?.userId) return

  try {
    await api.social.upvote('reply', reply._id || reply.replyId, user.value.userId)
    await loadPosts()
  } catch (err: any) {
    console.error('Failed to upvote:', err)
  }
}

useHead({
  title: 'Forum - Apex Academy'
})
</script>

