/**
 * Client-side theme plugin
 * Runs before Vue hydration to prevent hydration mismatches
 */

export default defineNuxtPlugin(() => {
  if (process.server) return

  // Apply theme synchronously before hydration
  try {
    const savedTheme = localStorage.getItem('apex-academy-theme') || 'light-default'
    const themes: Record<string, any> = {
      'light-default': {
        bg: '#fafbfc',
        dark: '#f1f3f5',
        card: '#ffffff',
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        shadow: 'rgba(15, 23, 42, 0.08)',
        mode: 'light'
      },
      'dark-default': {
        bg: '#0a0a0a',
        dark: '#1a1a1a',
        card: '#2a2a2a',
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',
        text: '#e0e0e0',
        textSecondary: '#9ca3af',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)',
        mode: 'dark'
      },
      'diwali': {
        bg: '#fff9e6',
        dark: '#ffe6b3',
        card: '#ffffff',
        primary: '#ff6b35',
        secondary: '#ffa500',
        accent: '#ffd700',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#ffd700',
        shadow: 'rgba(255, 215, 0, 0.2)',
        mode: 'light'
      },
      'holi': {
        bg: '#fef3f3',
        dark: '#ffe6e6',
        card: '#ffffff',
        primary: '#ff1744',
        secondary: '#00e676',
        accent: '#ff9800',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#ff1744',
        shadow: 'rgba(255, 23, 68, 0.2)',
        mode: 'light'
      },
      'navratri': {
        bg: '#f3e5f5',
        dark: '#e1bee7',
        card: '#ffffff',
        primary: '#9c27b0',
        secondary: '#e91e63',
        accent: '#ff9800',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#9c27b0',
        shadow: 'rgba(156, 39, 176, 0.2)',
        mode: 'light'
      },
      'chuseok': {
        bg: '#fff5e6',
        dark: '#ffe6cc',
        card: '#ffffff',
        primary: '#d32f2f',
        secondary: '#1976d2',
        accent: '#f57c00',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#d32f2f',
        shadow: 'rgba(211, 47, 47, 0.2)',
        mode: 'light'
      },
      'seollal': {
        bg: '#fff3e0',
        dark: '#ffe0b2',
        card: '#ffffff',
        primary: '#ff6f00',
        secondary: '#e65100',
        accent: '#ffc107',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#ff6f00',
        shadow: 'rgba(255, 111, 0, 0.2)',
        mode: 'light'
      },
      'dano': {
        bg: '#f1f8e9',
        dark: '#dcedc8',
        card: '#ffffff',
        primary: '#689f38',
        secondary: '#8bc34a',
        accent: '#ffc107',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#689f38',
        shadow: 'rgba(104, 159, 56, 0.2)',
        mode: 'light'
      },
      'thanksgiving': {
        bg: '#fff8e1',
        dark: '#ffecb3',
        card: '#ffffff',
        primary: '#e65100',
        secondary: '#ff6f00',
        accent: '#ffab00',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#e65100',
        shadow: 'rgba(230, 81, 0, 0.2)',
        mode: 'light'
      },
      'independence-day': {
        bg: '#e3f2fd',
        dark: '#bbdefb',
        card: '#ffffff',
        primary: '#1976d2',
        secondary: '#d32f2f',
        accent: '#ffffff',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#1976d2',
        shadow: 'rgba(25, 118, 210, 0.2)',
        mode: 'light'
      },
      'halloween': {
        bg: '#0a0a0a',
        dark: '#1a1a1a',
        card: '#2a2a2a',
        primary: '#ff6b35',
        secondary: '#ff8c42',
        accent: '#ccff00',
        text: '#e0e0e0',
        textSecondary: '#9ca3af',
        border: '#ff6b35',
        shadow: 'rgba(255, 107, 53, 0.3)',
        mode: 'dark'
      },
      'christmas': {
        bg: '#f3f4f6',
        dark: '#e5e7eb',
        card: '#ffffff',
        primary: '#dc2626',
        secondary: '#059669',
        accent: '#fbbf24',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#dc2626',
        shadow: 'rgba(220, 38, 38, 0.2)',
        mode: 'light'
      },
      'easter': {
        bg: '#fef3f3',
        dark: '#fce7e7',
        card: '#ffffff',
        primary: '#ec4899',
        secondary: '#a855f7',
        accent: '#fbbf24',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#ec4899',
        shadow: 'rgba(236, 72, 153, 0.2)',
        mode: 'light'
      },
      'canada-day': {
        bg: '#fef2f2',
        dark: '#fee2e2',
        card: '#ffffff',
        primary: '#dc2626',
        secondary: '#1e40af',
        accent: '#ffffff',
        text: '#1a1a1a',
        textSecondary: '#6b7280',
        border: '#dc2626',
        shadow: 'rgba(220, 38, 38, 0.2)',
        mode: 'light'
      }
    }

    const theme = themes[savedTheme] || themes['light-default']
    const root = document.documentElement

    root.style.setProperty('--theme-bg', theme.bg)
    root.style.setProperty('--theme-dark', theme.dark)
    root.style.setProperty('--theme-card', theme.card)
    root.style.setProperty('--theme-primary', theme.primary)
    root.style.setProperty('--theme-secondary', theme.secondary)
    root.style.setProperty('--theme-accent', theme.accent)
    root.style.setProperty('--theme-text', theme.text)
    root.style.setProperty('--theme-text-secondary', theme.textSecondary)
    root.style.setProperty('--theme-border', theme.border)
    root.style.setProperty('--theme-shadow', theme.shadow)
    root.style.backgroundColor = theme.bg
    root.classList.remove('light', 'dark')
    root.classList.add(theme.mode)
    
    // Force color-scheme to match our theme, ignore system preference
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]')
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme.mode)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'color-scheme'
      meta.content = theme.mode
      document.head.appendChild(meta)
    }
  } catch (e) {
    // Silently fail - theme will be applied on mount
  }
})
