<script setup lang="ts">
// Redirect /course/[slug] to /subjects/[slug] since /subjects/[slug] has more features (tabs for Lessons, Quizzes, Images)
const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

onMounted(() => {
  router.replace(`/subjects/${slug}`)
})
</script>
