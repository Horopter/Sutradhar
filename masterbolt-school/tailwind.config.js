/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00d4ff', // Bright cyan (blueshifted)
          dark: '#00b4d8',
          light: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#ff4444', // Bright red (redshifted)
          dark: '#dc2626',
          light: '#ff6b6b',
        },
        accent: {
          DEFAULT: '#ffffff', // White from accretion disk
          yellow: '#ffd700', // Gold from accretion disk
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

