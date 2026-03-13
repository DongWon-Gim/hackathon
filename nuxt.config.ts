export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  components: [
    { path: '~/components', pathPrefix: false }
  ],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    public: {}
  },

  typescript: {
    strict: true
  },

  app: {
    head: {
      title: 'RetroLens',
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
  },

  compatibilityDate: '2024-11-01'
})
