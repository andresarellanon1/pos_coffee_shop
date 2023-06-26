<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax } from 'swiper'
import 'swiper/css'
import { ref, useFetch, useState } from '.nuxt/imports';
const modules = [Navigation, Pagination, Scrollbar, Autoplay, Parallax]
const PRODUCTION_DELTA_MAX = 180000
const SYNC_TIMEOUT_MAX = 10000
interface Production {
  id: number
  display_name: string
  move_raw_ids: {
    id: number
    qty: number
  }
  product_id: []
  state: string
  priority: string
}
const productionQueue = ref<{ el: Production; delta: number }[]>([])
const done_ids = ref<number[]>([])
setInterval(async () => {
  const { data: version } = await useFetch('http://127.0.0.1:8080/version')
  if (version.value) {
    const { data: production } = await useFetch<Production>('http://127.0.0.1:8080/production')
    if (production.value)
      if (!productionQueue.value.find(va => va.el.id === production.value?.id))
        productionQueue.value.push({ el: production.value, delta: PRODUCTION_DELTA_MAX })
  }
}, SYNC_TIMEOUT_MAX)
setInterval(async () => {
  for (let el of productionQueue.value) {
    if (el.delta <= 1000) {
      let done = await markAsDone(el.el.id)
      if (done)
        done_ids.value.push(el.el.id)
    }
    else
      el.delta -= 1000
  }
}, 1000)
setInterval(() => {
  productionQueue.value.filter(el => done_ids.value.includes(el.el.id))
}, 3000)
const markAsDone = async (id: Number) => {
  const { data: done } = await useFetch(`http://127.0.0.1:8080/production`, {
    method: 'POST',
    body: { id: id },
  })
  return done.value
}
</script>

<template>
  <div class="flex flex-col w-screen h-screen bg-gray-100 ">
    <div>Ordenes en fila: </div>
    <div class="font-bold px-2">
      {{ productionQueue?.length }}
    </div>
    <Swiper :modules="modules" :slides-per-view="3" :space-between="50" navigation :scrollbar="{ draggable: true }"
      :pagination="{ clickable: true }" class="flex w-full h-full space-x-12 p-12 justify-between">
      <SwiperSlide v-for="prod in productionQueue" :key="prod.el?.id"
        class="flex flex-col w-full h-full p-8 bg-amber-200 border border-amber-300 shadow-amber-300 shadow-lg text-center font-bold text-4xl hover:bg-amber-100 cursor-pointer">
        <div class="text-dark-200 h-1/2 w-full">
          <div class="py-2 font-bold border border-black">
            {{ prod.delta / 1000 }}
          </div>
          <div class="w-full py-2 border-b border-black">
            {{ prod.el.product_id[1] }}
          </div>
        </div>
        <div class="text-gray-600 h-1/2 w-full h-full">
          <div class="w-full py-2">
            Extras:
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
