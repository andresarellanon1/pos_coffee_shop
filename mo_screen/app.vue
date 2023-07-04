<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax } from 'swiper'
import 'swiper/css'
import { ref, useFetch, useState } from '.nuxt/imports';
import { TransitionRoot } from '@headlessui/vue'

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
    display_name: string
    qty: number
  }[]
  product: {
    id: number
    display_name: string
  }
}
const productionQueue = ref<{ item: Production[]; delta: number; done: boolean }[]>([])
const markAsDone = async (production: Production[]) => {
  const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  if (version.value !== null)
    for (let prod of production) {
      const { data: done } = await useFetch<number>("http://158.69.63.47:8080/production", {
        method: "POST",
        headers: {
          "Accept": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: prod.id })
      });
      if (done.value !== null && done.value === prod.id) continue;
      else break;
    }
}
const syncOrders = async () => {
  productionQueue.value = productionQueue.value.filter(element => !element.done);
  const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  if (version.value === null) return
  const { data: production } = await useFetch<Production[]>('http://158.69.63.47:8080/production', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  console.warn('got production')
  console.log(production.value)
  if (production.value !== null && Array.isArray(production.value) && production.value?.length > 0)
    productionQueue.value.push({ item: production.value, delta: PRODUCTION_DELTA_MAX, done: false });
}
const checkInterval = () => {
  let buff = productionQueue.value;
  for (let prod of buff) {
    if (prod.delta <= 1000) {
      markAsDone(prod.item)
      prod.done = true
    }
    else
      prod.delta -= 1000
  }
}
const fetchQueueCache = async () => {
  const { data: version } = await useFetch('http://158.69.63.47:8080/version', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  if (version.value === null) return
  const { data: queue } = await useFetch<Production[]>('http://158.69.63.47:8080/getProductionQueue', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  const { data: cache } = await useFetch<Production[]>('http://158.69.63.47:8080/getProductionCache', {
    method: "GET",
    headers: {
      "Accept": "*",
    }
  });
  console.warn('QUEUE AND CACHE')
  console.log(queue.value)
  console.log(cache.value)
}

onMounted(() => {
  setInterval(() => {
    tock.value = 10
    syncOrders()
    fetchQueueCache()
  }, SYNC_TIMEOUT_MAX)
  setInterval(() => {
    tock.value -= 1
    checkInterval()
  }, 1000)
})
</script>

<template>
  <div class="flex flex-col w-screen h-screen bg-gray-100 px-2 py-1">
    <div
      class="bg-gray-400 shadow-xl absolute m-2 p-4 w-16 h-16 flex flex-col items-center justify-center font-bold text-white text-xl rounded-full top-0 right-0">
      {{ tock }}
    </div>
    <div v-if="productionQueue?.length > 0">
      <div class="flex space-x-2 w-full text-center justify-center">
        <div>Ordenes en fila: </div>
        <div>{{ productionQueue?.length }}</div>
      </div>
      <Swiper :modules="modules" :slides-per-view="5" :space-between="5" navigation :scrollbar="{ draggable: true }"
        :pagination="{ clickable: true }" class="flex w-full h-auto pace-x-12 justify-between">
        <SwiperSlide v-for="(productionOrder, index) in productionQueue" :key="index"
          class="flex flex-col w-full h-auto p-2 shadow-lg text-center font-bold text-sm cursor-pointer bg-white hover:bg-gray-100 border border-black  rounded">
          <div class="text-dark-200 h-auto w-full flex flex-col items-center">
            <div class="w-16 shadow shadow-xl rounded-full py-1 text-white"
              :class="[productionOrder.delta < 60000 ? 'bg-red-700' : 'bg-emerald-400']">
              {{ productionOrder.delta / 1000 }}
            </div>
            <div v-for="production in productionOrder.item" :key="production.id" class="w-full overflow-y-auto">
              {{ production.display_name }}
              <div class="w-full border-b border-black">
                {{ production.product.display_name }}
              </div>
              <div class="text-gray-900 w-full h-full">
                <div class="w-full py-2">
                  Componentes:
                </div>
                <div v-for="extra in production.component" :key="extra.display_name"
                  class="w-full flex text-xs  text-center">
                  <span v-if="extra.qty > 0"> {{ extra.display_name }} ({{ extra.qty }}) </span>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
    <div v-else class="text-center text-lg font-bold text-gray-400">
      No hay ordenes en fila
    </div>
  </div>
</template>
