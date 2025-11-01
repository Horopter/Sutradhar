<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
    <SummonSutradhar />
    <Notifications />
  </div>
</template>

<script setup>
// Nuxt auto-imports components, but explicit imports work too
</script>

