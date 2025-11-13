import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class', // Use class-based dark mode, not media query (ignores system preference)
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables
        'theme': {
          'bg': 'var(--theme-bg)',
          'dark': 'var(--theme-dark)',
          'card': 'var(--theme-card)',
          'primary': 'var(--theme-primary)',
          'secondary': 'var(--theme-secondary)',
          'accent': 'var(--theme-accent)',
          'text': 'var(--theme-text)',
          'text-secondary': 'var(--theme-text-secondary)',
          'border': 'var(--theme-border)',
        },
        // Legacy halloween colors for backward compatibility
        'halloween': {
          'bg': '#0a0a0a',
          'dark': '#1a1a1a',
          'card': '#2a2a2a',
          'orange': '#ff6b35',
          'pumpkin': '#ff8c42',
          'neon': '#39ff14',
          'lime': '#ccff00',
          'ghost': '#e0e0e0'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px var(--theme-primary), 0 0 10px var(--theme-primary), 0 0 15px var(--theme-primary)' },
          '100%': { boxShadow: '0 0 10px var(--theme-primary), 0 0 20px var(--theme-primary), 0 0 30px var(--theme-primary)' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

