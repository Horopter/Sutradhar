<template>
  <div class="fixed top-20 right-4 z-50 space-y-2">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="notification.type === 'success' ? 'bg-green-500/20 border-green-500' : notification.type === 'error' ? 'bg-red-500/20 border-red-500' : 'bg-halloween-orange/20 border-halloween-orange'"
      class="px-4 py-3 rounded-lg border shadow-lg min-w-[300px]"
    >
      <p class="text-halloween-ghost">{{ notification.message }}</p>
    </div>
  </div>
</template>

<script setup>
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

