<template>
  <div class="fixed top-20 right-4 z-50 space-y-2">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="px-4 py-3 rounded-lg border shadow-lg min-w-[300px]"
      :style="notification.type === 'success' 
        ? { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#16a34a', color: '#16a34a' }
        : notification.type === 'error'
        ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#dc2626', color: '#dc2626' }
        : { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderColor: 'var(--theme-primary)', color: 'var(--theme-text)' }"
    >
      <p>{{ notification.message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  const notifications = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>('notifications', () => [])

// Auto-remove notifications after 5 seconds
watch(notifications, (newVal) => {
  newVal.forEach((n) => {
    setTimeout(() => {
      const index = notifications.value.findIndex((x) => x.id === n.id)
      if (index > -1) notifications.value.splice(index, 1)
    }, 5000)
  })
}, { deep: true })
</script>

