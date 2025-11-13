// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    port: 5000
  },
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  css: ['~/assets/css/main.css'],
  
  // Build configuration for production
  nitro: {
    output: {
      dir: 'output-temp'
    },
    // For static generation, uncomment the following:
    // prerender: {
    //   routes: ['/']
    // }
  },
  
  // SSR configuration (for Node.js hosting)
  ssr: true,
  
  app: {
    head: {
      title: 'Masterbolt',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Masterbolt - Your AI-Powered Learning Companion. An agentic AI-driven learning platform that guides, visualizes, and adapts to help everyone learn better. Powered by Sutradhar.' },
        { name: 'theme-color', content: '#00d4ff' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap' }
      ]
    }
  }
})

