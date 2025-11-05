<template>
  <div ref="themeSwitcherRef" class="relative z-10">
    <button
      @click.stop="toggleMenu"
      class="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 touch-manipulation relative z-10 cursor-pointer"
      :title="`Current theme: ${theme.name}`"
      aria-label="Change theme"
      type="button"
      style="pointer-events: auto;"
    >
      <span class="text-base sm:text-lg">{{ theme.emoji }}</span>
      <span class="hidden sm:inline text-xs sm:text-sm">{{ theme.name }}</span>
      <span class="text-xs sm:text-sm hidden sm:inline">▼</span>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-[90vw] sm:w-80 max-w-sm max-h-[70vh] sm:max-h-[600px] overflow-y-auto rounded-xl shadow-2xl z-[60] border"
        style="background-color: var(--theme-card); border-color: var(--theme-border);"
        @click.stop
      >
        <div class="p-4">
          <!-- Standard Themes -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              STANDARD MODES
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="t in standardThemes"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <div>
                    <div class="font-medium" style="color: var(--theme-text);">{{ t.name }}</div>
                    <div class="text-xs" style="color: var(--theme-text-secondary);">{{ t.mode }}</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Hindu Festivals -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              🕉️ HINDU FESTIVALS
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="t in festivalThemes.hindu"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <span class="font-medium" style="color: var(--theme-text);">{{ t.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Korean Festivals -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              🇰🇷 KOREAN FESTIVALS
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="t in festivalThemes.korean"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <span class="font-medium" style="color: var(--theme-text);">{{ t.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- US Festivals -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              🇺🇸 US FESTIVALS
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="t in festivalThemes.us"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <span class="font-medium" style="color: var(--theme-text);">{{ t.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- UK Festivals -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              🇬🇧 UK FESTIVALS
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="t in festivalThemes.uk"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <span class="font-medium" style="color: var(--theme-text);">{{ t.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Canada Festivals -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold mb-3" style="color: var(--theme-text-secondary);">
              🇨🇦 CANADA FESTIVALS
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="t in festivalThemes.canada"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="p-3 rounded-lg border-2 transition-all text-left"
                :class="themeId === t.id ? 'ring-2' : ''"
                :style="{
                  backgroundColor: themeId === t.id ? `color-mix(in srgb, ${t.colors.primary} 20%, transparent)` : 'transparent',
                  borderColor: themeId === t.id ? t.colors.primary : 'var(--theme-border)',
                  ringColor: t.colors.primary
                }"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ t.emoji }}</span>
                  <span class="font-medium" style="color: var(--theme-text);">{{ t.name }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useTheme, type Theme } from '~/composables/useTheme'

const { themeId, theme, applyTheme, getFestivalThemes, getThemesByCategory } = useTheme()

const showMenu = ref(false)
const festivalThemes = getFestivalThemes()
const standardThemes = getThemesByCategory().standard

const selectTheme = (id: string) => {
  applyTheme(id)
  showMenu.value = false
}

const toggleMenu = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  showMenu.value = !showMenu.value
  console.log('Theme menu toggled:', showMenu.value) // Debug log
}

const themeSwitcherRef = ref<HTMLElement | null>(null)

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // Only handle if menu is open
    if (!showMenu.value) return
    
    const target = event.target as HTMLElement
    // Check if click is outside the theme switcher component
    if (themeSwitcherRef.value && !themeSwitcherRef.value.contains(target)) {
      showMenu.value = false
    }
  }
  
  // Use nextTick to ensure the click handler is attached after the button click handler
  nextTick(() => {
    document.addEventListener('click', handleClickOutside)
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>
