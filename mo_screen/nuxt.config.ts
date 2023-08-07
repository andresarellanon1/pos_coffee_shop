// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    jwt_secret: process.env.NUXT_JWT_FIXED_TOKEN,
    dumb_fuck: 'abc'
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  ssr: true,

})
