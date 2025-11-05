/**
 * Theme Management Composable
 * Supports multiple festival themes and light/dark modes
 */

export interface ThemeColors {
  bg: string
  dark: string
  card: string
  primary: string
  secondary: string
  accent: string
  text: string
  textSecondary: string
  border: string
  shadow: string
}

export interface Theme {
  id: string
  name: string
  emoji: string
  colors: ThemeColors
  mode: 'light' | 'dark'
  category: 'festival' | 'standard'
}

// Light Mode Themes
export const themes: Record<string, Theme> = {
  // Light Mode - Standard (Premium Modern Design)
  'light-default': {
    id: 'light-default',
    name: 'Light Mode',
    emoji: '☀️',
    mode: 'light',
    category: 'standard',
    colors: {
      bg: '#fafbfc', // Soft warm white instead of pure white
      dark: '#f1f3f5', // Subtle gray for elevated surfaces
      card: '#ffffff', // Pure white cards for contrast
      primary: '#6366f1', // Modern indigo (sophisticated, trustworthy)
      secondary: '#8b5cf6', // Purple accent for variety
      accent: '#f59e0b', // Warm amber for highlights
      text: '#0f172a', // Deep slate for excellent readability
      textSecondary: '#64748b', // Muted slate for secondary text
      border: '#e2e8f0', // Soft slate border
      shadow: 'rgba(15, 23, 42, 0.08)' // Subtle, modern shadow
    }
  },
  
  // Dark Mode - Standard
  'dark-default': {
    id: 'dark-default',
    name: 'Dark Mode',
    emoji: '🌙',
    mode: 'dark',
    category: 'standard',
    colors: {
      bg: '#0a0a0a',
      dark: '#1a1a1a',
      card: '#2a2a2a',
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      text: '#e0e0e0',
      textSecondary: '#9ca3af',
      border: '#374151',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  },

  // Hindu Festivals
  'diwali': {
    id: 'diwali',
    name: 'Diwali',
    emoji: '🪔',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fff9e6',
      dark: '#ffe6b3',
      card: '#ffffff',
      primary: '#ff6b35',
      secondary: '#ffa500',
      accent: '#ffd700',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#ffd700',
      shadow: 'rgba(255, 215, 0, 0.2)'
    }
  },
  'holi': {
    id: 'holi',
    name: 'Holi',
    emoji: '🎨',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fef3f3',
      dark: '#ffe6e6',
      card: '#ffffff',
      primary: '#ff1744',
      secondary: '#00e676',
      accent: '#ff9800',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#ff1744',
      shadow: 'rgba(255, 23, 68, 0.2)'
    }
  },
  'navratri': {
    id: 'navratri',
    name: 'Navratri',
    emoji: '🕉️',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#f3e5f5',
      dark: '#e1bee7',
      card: '#ffffff',
      primary: '#9c27b0',
      secondary: '#e91e63',
      accent: '#ff9800',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#9c27b0',
      shadow: 'rgba(156, 39, 176, 0.2)'
    }
  },

  // Korean Festivals
  'chuseok': {
    id: 'chuseok',
    name: 'Chuseok',
    emoji: '🌕',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fff5e6',
      dark: '#ffe6cc',
      card: '#ffffff',
      primary: '#d32f2f',
      secondary: '#1976d2',
      accent: '#f57c00',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#d32f2f',
      shadow: 'rgba(211, 47, 47, 0.2)'
    }
  },
  'seollal': {
    id: 'seollal',
    name: 'Seollal',
    emoji: '🐉',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fff3e0',
      dark: '#ffe0b2',
      card: '#ffffff',
      primary: '#ff6f00',
      secondary: '#e65100',
      accent: '#ffc107',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#ff6f00',
      shadow: 'rgba(255, 111, 0, 0.2)'
    }
  },
  'dano': {
    id: 'dano',
    name: 'Dano',
    emoji: '🌾',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#f1f8e9',
      dark: '#dcedc8',
      card: '#ffffff',
      primary: '#689f38',
      secondary: '#8bc34a',
      accent: '#ffc107',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#689f38',
      shadow: 'rgba(104, 159, 56, 0.2)'
    }
  },

  // US Festivals
  'thanksgiving': {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fff8e1',
      dark: '#ffecb3',
      card: '#ffffff',
      primary: '#e65100',
      secondary: '#ff6f00',
      accent: '#ffab00',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#e65100',
      shadow: 'rgba(230, 81, 0, 0.2)'
    }
  },
  'independence-day': {
    id: 'independence-day',
    name: 'Independence Day',
    emoji: '🇺🇸',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#e3f2fd',
      dark: '#bbdefb',
      card: '#ffffff',
      primary: '#1976d2',
      secondary: '#d32f2f',
      accent: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#1976d2',
      shadow: 'rgba(25, 118, 210, 0.2)'
    }
  },
  'halloween': {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    mode: 'dark',
    category: 'festival',
    colors: {
      bg: '#0a0a0a',
      dark: '#1a1a1a',
      card: '#2a2a2a',
      primary: '#ff6b35',
      secondary: '#ff8c42',
      accent: '#ccff00',
      text: '#e0e0e0',
      textSecondary: '#9ca3af',
      border: '#ff6b35',
      shadow: 'rgba(255, 107, 53, 0.3)'
    }
  },

  // UK Festivals
  'christmas': {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#f3f4f6',
      dark: '#e5e7eb',
      card: '#ffffff',
      primary: '#dc2626',
      secondary: '#059669',
      accent: '#fbbf24',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#dc2626',
      shadow: 'rgba(220, 38, 38, 0.2)'
    }
  },
  'easter': {
    id: 'easter',
    name: 'Easter',
    emoji: '🐰',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fef3f3',
      dark: '#fce7e7',
      card: '#ffffff',
      primary: '#ec4899',
      secondary: '#a855f7',
      accent: '#fbbf24',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#ec4899',
      shadow: 'rgba(236, 72, 153, 0.2)'
    }
  },

  // Canada Festivals
  'canada-day': {
    id: 'canada-day',
    name: 'Canada Day',
    emoji: '🇨🇦',
    mode: 'light',
    category: 'festival',
    colors: {
      bg: '#fef2f2',
      dark: '#fee2e2',
      card: '#ffffff',
      primary: '#dc2626',
      secondary: '#1e40af',
      accent: '#ffffff',
      text: '#1a1a1a',
      textSecondary: '#6b7280',
      border: '#dc2626',
      shadow: 'rgba(220, 38, 38, 0.2)'
    }
  }
}

export const useTheme = () => {
  const themeId = ref<string>('light-default') // Default to light mode
  const theme = computed(() => themes[themeId.value] || themes['light-default'])

  // Load theme from localStorage on mount
  if (process.client) {
    const savedTheme = localStorage.getItem('apex-academy-theme')
    if (savedTheme && themes[savedTheme]) {
      themeId.value = savedTheme
    }
  }

  // Apply theme to document
  const applyTheme = (newThemeId: string) => {
    if (!process.client) return
    
    const newTheme = themes[newThemeId]
    if (!newTheme) return

    themeId.value = newThemeId
    localStorage.setItem('apex-academy-theme', newThemeId)

    // Apply CSS variables
    const root = document.documentElement
    root.style.setProperty('--theme-bg', newTheme.colors.bg)
    root.style.setProperty('--theme-dark', newTheme.colors.dark)
    root.style.setProperty('--theme-card', newTheme.colors.card)
    root.style.setProperty('--theme-primary', newTheme.colors.primary)
    root.style.setProperty('--theme-secondary', newTheme.colors.secondary)
    root.style.setProperty('--theme-accent', newTheme.colors.accent)
    root.style.setProperty('--theme-text', newTheme.colors.text)
    root.style.setProperty('--theme-text-secondary', newTheme.colors.textSecondary)
    root.style.setProperty('--theme-border', newTheme.colors.border)
    root.style.setProperty('--theme-shadow', newTheme.colors.shadow)
    
    // Set background color directly on html element
    root.style.backgroundColor = newTheme.colors.bg

    // Set mode class
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme.mode)
    
    // Force color-scheme meta tag to match our theme, ignore system preference
    let metaColorScheme = document.querySelector('meta[name="color-scheme"]')
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', newTheme.mode)
    } else {
      metaColorScheme = document.createElement('meta')
      metaColorScheme.setAttribute('name', 'color-scheme')
      metaColorScheme.setAttribute('content', newTheme.mode)
      document.head.appendChild(metaColorScheme)
    }
  }

  // Initialize theme immediately (before hydration)
  if (process.client) {
    // Apply theme synchronously before Vue hydration
    const savedTheme = localStorage.getItem('apex-academy-theme')
    const initialTheme = savedTheme && themes[savedTheme] ? savedTheme : 'light-default'
    applyTheme(initialTheme)
  }

  // Initialize theme on mount (for reactive updates)
  onMounted(() => {
    applyTheme(themeId.value)
  })

  // Watch for theme changes
  watch(themeId, (newId) => {
    applyTheme(newId)
  })

  // Get all themes grouped by category
  const getThemesByCategory = () => {
    const grouped: Record<string, Theme[]> = {
      standard: [],
      festival: []
    }
    
    Object.values(themes).forEach(t => {
      grouped[t.category].push(t)
    })
    
    return grouped
  }

  // Get festival themes by region
  const getFestivalThemes = () => {
    return {
      hindu: Object.values(themes).filter(t => ['diwali', 'holi', 'navratri'].includes(t.id)),
      korean: Object.values(themes).filter(t => ['chuseok', 'seollal', 'dano'].includes(t.id)),
      us: Object.values(themes).filter(t => ['thanksgiving', 'independence-day', 'halloween'].includes(t.id)),
      uk: Object.values(themes).filter(t => ['christmas', 'easter'].includes(t.id)),
      canada: Object.values(themes).filter(t => ['canada-day'].includes(t.id))
    }
  }

  return {
    themeId,
    theme,
    themes,
    applyTheme,
    getThemesByCategory,
    getFestivalThemes
  }
}
