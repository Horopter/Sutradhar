// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    'pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      sutradharBaseUrl: process.env.SUTRADHAR_BASE_URL || 'http://localhost:2198'
    }
  },
  app: {
    head: {
      title: 'Apex Academy',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Apex Academy - Learn Computer Science' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})

