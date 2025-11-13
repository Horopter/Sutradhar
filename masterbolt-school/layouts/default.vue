<template>
  <div class="min-h-screen">
    <NuxtPage />
  </div>
</template>

<script setup>
// Smooth scroll behavior
if (process.client) {
  document.documentElement.style.scrollBehavior = 'smooth'
}
</script>

