<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax, EffectCreative } from 'swiper'
import 'swiper/css'
import { ref, useFetch } from '.nuxt/imports'
import nuxtStorage from 'nuxt-storage'

const isLogin = ref(false)
const modules = [Navigation, Pagination, Scrollbar, Autoplay, Parallax, EffectCreative]
const PRODUCTION_DELTA_MAX = 180000
const SYNC_TIMEOUT_MAX = 3000
const tock = ref(10)
interface Production {
  id: number
  display_name: string
  state: string
  priority: string
  origin: string
  component: {
    id: number
    display_name: string
    qty: number
  }[]
  product: {
    id: number
    display_name: string
  }
}
interface Products {
  id: number
  categ: string
  pos_categ: string
  display_name: string
  pos_production: boolean
}
const productionQueue = ref<{ [key: string]: { origin: string; item: Production[]; delta: number } }>({})
const allowedProductIds = ref<number[]>([])
const auth = ref<{ jwt_secret: string; jwt_refresh: string; jwt_expires: string }>({
  jwt_secret: '',
  jwt_refresh: '',
  jwt_expires: '',
})

async function login(data: { user: string, password: string }) {
  try {
    const body = JSON.stringify({ user: data.user, password: data.password })
    const { data: token, error } = await useFetch<{ token: string }>('http://158.69.63.47:8080/login', {
      method: "POST",
      headers: {
        "Accept": "*",
        "Content-Type": "application/json",
      },
      body: body
    })
    if (token.value === null) return
    auth.value.jwt_secret = token.value.token
    nuxtStorage.localStorage.setData('jwt_secret', token.value)
    isLogin.value = true
  } catch (e) {
    console.error(e)
  }
}

async function markAsDone(production: Production[]) {
  try {
    const { data: version, error } = await useFetch('http://158.69.63.47:8080/version', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (error.value?.statusCode === 401) isLogin.value = false
    if (version.value !== null)
      for (let prod of production) {
        const { data: done } = await useFetch<number>("http://158.69.63.47:8080/production", {
          method: "POST",
          headers: {
            "Accept": "*",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.value.jwt_secret}`,
          },
          body: JSON.stringify({ id: prod.id })
        })
      }
  } catch (e) {
    console.error(e)
  }
}
// fetch 1 order at a time (List<OrderPayload>)
async function fetchNextMrpProduction() {
  try {
    const { data: version, error: error } = await useFetch('http://158.69.63.47:8080/version', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    console.warn(version.value)
    if (error.value?.statusCode === 401) isLogin.value = false
    if (version.value === null) return
    const { data: production } = await useFetch<Production[]>('http://158.69.63.47:8080/production', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (production.value === null) return
    const { data: products } = await useFetch<Products[]>('http://158.69.63.47:8080/products', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (products.value === null) return
    allowedProductIds.value = []
    for (let product of products.value) {
      if (product.pos_categ === 'Extra' && product.categ === 'Component') {
        allowedProductIds.value.push(product.id)
      }
    }
    if (Array.isArray(production.value) && production.value.length > 0) {
      production.value.map(p => {
        p.component = p.component.filter(c => allowedProductIds.value.includes(c.id))
        return p
      })
      productionQueue.value[production.value[0].origin] = {
        origin: production.value[0].origin,
        item: production.value,
        delta: PRODUCTION_DELTA_MAX,
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function syncCaches() {
  try {
    const { data: version, error } = await useFetch('http://158.69.63.47:8080/version', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (error.value?.statusCode === 401) isLogin.value = false
    if (version.value === null) return
    const { data: cache } = await useFetch<{ [key: string]: Production[] }>('http://158.69.63.47:8080/getProductionCache', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (cache.value === null) return
    const { data: products } = await useFetch<Products[]>('http://158.69.63.47:8080/products', {
      method: "GET",
      headers: {
        "Accept": "*",
        "Authorization": `Bearer ${auth.value.jwt_secret}`,
      }
    })
    if (products.value === null) return
    allowedProductIds.value = []
    for (let product of products.value) {
      if (product.pos_categ === 'Extra' && product.categ === 'Component') {
        allowedProductIds.value.push(product.id)
      }
    }
    for (let key in productionQueue.value) {
      let cacheKey = Object.keys(cache.value).find(k => key === k)
      if (!cacheKey)
        delete productionQueue.value[key]
      else {
        productionQueue.value[key].item = cache.value[cacheKey].map(ca => {
          ca.component = ca.component.filter(c => allowedProductIds.value.includes(c.id))
          return ca
        })
      }
    }
  } catch (e) {
    console.error(e)
  }
}
function checkIntervalDone() {
  for (let key in productionQueue.value) {
    if (productionQueue.value[key].delta <= 1000)
      markAsDone(productionQueue.value[key].item)
    else
      productionQueue.value[key].delta -= 1000
  }
}
const tick_interval = setInterval(async () => {
  if (isLogin.value) {
    await syncCaches()
    await fetchNextMrpProduction()
  }
}, SYNC_TIMEOUT_MAX)
const tock_interval = setInterval(async () => {
  if (isLogin.value) {
    tock.value -= 1
    if (tock.value === 0) tock.value = 3
    checkIntervalDone()
  }
}, 1000)
onBeforeUnmount(() => {
  clearInterval(tick_interval)
  clearInterval(tock_interval)
})
const cardClick = (index: string) => {
  productionQueue.value[index].delta = 3000
}
</script>

<template>
  <div class="w-screen h-screen ">
    <div v-if="isLogin" class="flex flex-col h-full w-full bg-gray-100 px-2 py-1">
      <div
        class="bg-gray-400 shadow-xl absolute m-2 p-4 w-16 h-16 flex flex-col items-center justify-center font-bold text-white text-xl rounded-full top-0 right-0">
        {{ tock }}
      </div>
      <div v-if="Object.keys(productionQueue).length !== 0">
        <div class="flex space-x-2 w-full text-center justify-center">
          <div>Órdenes de fabricación en fila: </div>
          <div>{{ productionQueue?.length }}</div>
        </div>
        <Swiper :modules="modules" :slides-per-view="5" :space-between="5" navigation :scrollbar="{ draggable: true }"
          :pagination="{ clickable: true }" class="flex w-full h-auto pace-x-12 justify-between cursor-pointer">
          <SwiperSlide v-for="key in Object.keys(productionQueue).reverse()" :key="key" @click="cardClick(key)"
            class="flex flex-col w-full h-auto p-2 text-center font-bold text-xs ">
            <div class="text-dark-200 h-auto w-full flex flex-col items-center space-y-2">
              <div
                class="flex p-2 w-full justify-between items-center text-xs font-light font-sans cursor-pointer bg-white hover:bg-gray-100 border border-black  rounded">
                <span class="w-full"> {{ productionQueue[key].item[0].origin }} </span>
                <div class="w-full justify-end text-end "
                  :class="[productionQueue[key].delta < 60000 ? 'text-red-700' : 'text-emerald-700']">
                  {{ productionQueue[key].delta / 1000 }}
                </div>
              </div>
              <div v-for="production in productionQueue[key].item" :key="production.id"
                class="flex flex-col justify-center items-center p-2 w-full overflow-y-auto cursor-pointer bg-white hover:bg-gray-100 border border-black  rounded">
                <span class="w-full font-light"> {{ production.display_name }} </span>
                <span class="w-full"> {{ production.product.display_name }}</span>
                <div class="text-gray-900 w-full h-full">
                  <div v-for="extra in production.component" :key="extra.display_name"
                    class="w-full flex flex-col justify-center items-center font-light text-center">
                    <span v-if="extra.qty > 0"> {{ extra.display_name }} ({{ extra.qty }}) </span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
      <div v-else class="text-center text-lg font-bold text-gray-400">
        No hay órdenes de fabricación en fila
      </div>
    </div>
    <div class="h-full w-full" v-else>
      <Login @login="login" />
    </div>
  </div>
</template>
