<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// Theme is applied via plugin before hydration
// This ensures no hydration mismatches
const { applyTheme, themeId } = useTheme()

onMounted(() => {
  // Sync theme state with applied theme
  applyTheme(themeId.value)
})
</script>