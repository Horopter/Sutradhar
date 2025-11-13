<script setup lang="ts">
// Redirect /subjects to /catalog since they're duplicates
const router = useRouter()
onMounted(() => {
  router.replace('/catalog')
})
</script>

