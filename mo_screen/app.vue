<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax } from 'swiper'
import 'swiper/css'
import { ref, useFetch } from '.nuxt/imports'

const modules = [Navigation, Pagination, Scrollbar, Autoplay, Parallax]
const PRODUCTION_DELTA_MAX = 180000
const SYNC_TIMEOUT_MAX = 10000
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
const markAsDone = async (production: Production[]) => {
  try {
    const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
      method: "GET",
      headers: {
        "Accept": "*",
      }
    })
    if (version.value !== null)
      for (let prod of production) {
        const { data: done } = await useFetch<number>("http://158.69.63.47:8080/production", {
          method: "POST",
          headers: {
            "Accept": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: prod.id })
        })
      }
  } catch (e) {
    console.error(e)
  }
}
// fetch 1 order at a time (List<OrderPayload>)
const fetchNextMrpProduction = async () => {
  const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  })
  if (version.value === null) return
  const { data: production } = await useFetch<Production[]>('http://158.69.63.47:8080/production', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  })
  if (production.value === null) return
  const { data: products } = await useFetch<Products[]>('http://158.69.63.47:8080/products', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  })
  if (products.value === null) return
  for (let product of products.value) {
    if (product.pos_categ === 'Extra' && product.categ === 'Component') {
      allowedProductIds.value.push(product.id)
    }
  }
  production.value.map(p => {
    p.component.filter(c => allowedProductIds.value.includes(c.id))
    return p
  })
  if (Array.isArray(production.value) && production.value.length > 0)
    productionQueue.value[production.value[0].origin] = {
      origin: production.value[0].origin,
      item: production.value,
      delta: PRODUCTION_DELTA_MAX,
    }
}
const checkIntervalDone = () => {
  for (let key in productionQueue.value) {
    if (productionQueue.value[key].delta <= 1000)
      markAsDone(productionQueue.value[key].item)
    else
      productionQueue.value[key].delta -= 1000
  }
}
const syncCaches = async () => {
  const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  })
  if (version.value === null) return
  const { data: cache } = await useFetch<{ [key: string]: Production[] }>('http://158.69.63.47:8080/getProductionCache', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  })
  if (cache.value === null) return
  for (let key in productionQueue.value) {
    if (Object.keys(cache.value).find(k => key === k)) continue
    delete productionQueue.value[key]
  }
}

const tick_interval = setInterval(async () => {
  await syncCaches()
  await fetchNextMrpProduction()
}, SYNC_TIMEOUT_MAX)
const tock_interval = setInterval(() => {
  tock.value -= 1
  if (tock.value === 0) tock.value = 10
  checkIntervalDone()
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
  <div class="flex flex-col w-screen h-screen bg-gray-100 px-2 py-1">
    <div
      class="bg-gray-400 shadow-xl absolute m-2 p-4 w-16 h-16 flex flex-col items-center justify-center font-bold text-white text-xl rounded-full top-0 right-0">
      {{ tock }}
    </div>
    <div v-if="Object.keys(productionQueue).length !== 0">
      <div class="flex space-x-2 w-full text-center justify-center">
        {{ allowedProductIds }}
        <div>Órdenes de fabricación en fila: </div>
        <div>{{ productionQueue?.length }}</div>
      </div>
      <Swiper :modules="modules" :slides-per-view="5" :space-between="5" navigation :scrollbar="{ draggable: true }"
        :pagination="{ clickable: true }" class="flex w-full h-auto pace-x-12 justify-between cursor-pointer">
        <SwiperSlide v-for="key in Object.keys(productionQueue)" :key="key" @click="cardClick(key)"
          class="flex flex-col w-full h-auto p-2 shadow-lg text-center font-bold text-xs cursor-pointer bg-white hover:bg-gray-100 border border-black  rounded">
          <div class="w-full justify-end text-end "
            :class="[productionQueue[key].delta < 60000 ? 'text-red-700' : 'text-emerald-700']">
            {{ productionQueue[key].delta / 1000 }}
          </div>
          <div class="text-dark-200 h-auto w-full flex flex-col items-center">
            <div class="flex text-xs font-light font-sans">
              {{ productionQueue[key].item[0].origin }}
            </div>
            <div v-for="production in productionQueue[key].item" :key="production.id" class="w-full overflow-y-auto">
              <div class="w-full flex flex-col items-center justify-baseline border-b border-black">
                {{ production.product.display_name }}
                {{ production.display_name }}
              </div>
              <div class="text-gray-900 w-full h-full">
                <div v-for="extra in production.component" :key="extra.display_name"
                  class="w-full flex font-light text-center">
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
</template>
