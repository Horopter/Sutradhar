<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
    <AIAssistant />
    <Notifications />
  </div>
</template>

<script setup>
// Nuxt auto-imports components from the components directory
</script>

