import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
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
          '0%': { boxShadow: '0 0 5px #ff6b35, 0 0 10px #ff6b35, 0 0 15px #ff6b35' },
          '100%': { boxShadow: '0 0 10px #ff6b35, 0 0 20px #ff6b35, 0 0 30px #ff6b35' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

