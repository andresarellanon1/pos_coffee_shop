// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    jwt_secret: process.env.NUXT_JWT_FIXED_TOKEN
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
})
