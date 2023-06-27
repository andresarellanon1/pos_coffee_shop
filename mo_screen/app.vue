<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax } from 'swiper'
import 'swiper/css'
import { ref, useFetch, useState } from '.nuxt/imports';
import { TransitionRoot } from '@headlessui/vue'

const modules = [Navigation, Pagination, Scrollbar, Autoplay, Parallax]
const PRODUCTION_DELTA_MAX = 180000
const SYNC_TIMEOUT_MAX = 10000
const baseURL = ''
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
const productionQueue = ref<{ item: Production; delta: number }[]>([])
const done_ids = ref<number[]>([])
// sync next
setInterval(async () => {
  const { data: version } = await useFetch('http://158.69.63.47:8080/version')
  if (version.value) {
    const { data: production, error } = await useFetch<Production>(`http://158.69.63.47:8080/production`)
    console.log(production.value)
    if(error)
      console.error(error.value)
    if (production.value)
      if (!productionQueue.value.find(value => value.item.id === production.value?.id))
        productionQueue.value.push({ item: production.value, delta: PRODUCTION_DELTA_MAX })
  }
}, SYNC_TIMEOUT_MAX)
// tick clock and check done 
setInterval(async () => {
  for (let item of productionQueue.value) {
    if (item.delta <= 1000) {
      done_ids.value.push(item.item.id)
      let done = await markAsDone(item.item.id)
    }
    else
      item.delta -= 1000
  }
  productionQueue.value = productionQueue.value.filter(item => !done_ids.value.includes(item.item.id))
}, 1000)
async function markAsDone(id: Number) {
  const { data: done } = await useFetch('http://158.69.63.47:8080/production', {
    method: 'POST',
    body: { id: id },
  })
  return done.value
}
</script>

<template>
  <div class="flex flex-col w-screen h-screen bg-gray-100 px-2 py-1">
    <div class="flex space-x-2 w-full text-center justify-center">
      <div>Ordenes en fila: </div>
      <div>{{ productionQueue?.length }}</div>
    </div>
    <Swiper :modules="modules" :slides-per-view="5" :space-between="5" navigation :scrollbar="{ draggable: true }"
      :pagination="{ clickable: true }" class="flex w-full h-auto pace-x-12 justify-between">
      <SwiperSlide v-for="prod in productionQueue" :key="prod.item?.id"
        class="flex flex-col w-full h-auto p-2 shadow-lg text-center font-bold text-sm cursor-pointer bg-white hover:bg-gray-100 border border-black  rounded">
        <div class="text-dark-200 h-auto w-full flex flex-col items-center">
          <div class="w-16 shadow shadow-xl rounded-full py-1 text-white" :class="[prod.delta < 60000 ? 'bg-red-700' : 'bg-emerald-400']">
             {{ prod.delta / 1000 }}
            </div>
          <div class="w-full">
              {{ prod.item.display_name}}  
          </div>
          <div class="w-full border-b border-black">
            {{ prod.item.product.display_name}}
          </div>
        </div>
        <div class="text-gray-900 w-full h-full">
          <div class="w-full py-2">
            Componentes:
          </div>
            <div v-for="extra in prod.item.component" :key="extra.display_name" class="w-full flex text-xs  text-center">
              <span v-if="extra.qty >= 1">
                {{ extra.display_name }} ({{extra.qty}})
              </span>
            </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
