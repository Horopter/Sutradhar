<template>
  <div class="logo-container" :class="containerClass">
    <img 
      :src="logoSrc" 
      :alt="'Masterbolt Logo'"
      :style="{ 
        width: showText ? 'auto' : `${size}px`,
        height: showText ? `${size}px` : `${size}px`,
        maxWidth: showText ? 'none' : '100%'
      }"
      class="logo-image"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number
  showText?: boolean
  variant?: 'default' | 'dark' | 'light'
}

const props = withDefaults(defineProps<Props>(), {
  size: 192,
  showText: true,
  variant: 'default'
})

const logoSrc = computed(() => {
  return '/logo.png'
})

const containerClass = computed(() => {
  const classes = ['logo-wrapper']
  if (props.variant === 'dark') classes.push('dark-theme')
  if (props.variant === 'light') classes.push('light-theme')
  return classes.join(' ')
})
</script>

<style scoped>
.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.logo-image {
  display: block;
  object-fit: contain;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

/* Theme variations */
.dark-theme .logo-image {
  filter: brightness(1.2);
}

.light-theme .logo-image {
  filter: brightness(0.8) contrast(1.2);
}
</style>