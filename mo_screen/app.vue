<script lang="ts" setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Scrollbar, Autoplay, Parallax } from 'swiper'
import 'swiper/css'
const col_a_text = () => useState('col_a')
const modules = [Navigation, Pagination, Scrollbar, Autoplay, Parallax]
const productionQueue = ref<{ el: any; delta: number }[]>([])
const { data: version } = await useFetch('http://158.69.63.47:8080/version')
const { data: production } = await useFetch<[]>('http://158.69.63.47:8080/production')
setInterval(async () => {
  if (version) {
    const { data: production } = await useFetch<[]>('http://158.69.63.47:8080/production')
    if (production)
      production.value!!.forEach((el) => {
        if (!productionQueue.value.find(va => va.el.id === el.id))
          productionQueue.value.push({ el, delta: 180000 })
      })
  }
}, 1000)
setInterval(() => {
  productionQueue.value.forEach((el) => {
    el.delta -= 1000
  })
  productionQueue.value = productionQueue.value.filter(el => el.delta >= 1000)
}, 1000)

</script>

<template>
  <div class="flex flex-col w-screen h-screen bg-gray-100 ">
    <div>Ordenes en fila: </div>
    <div class="font-bold px-2">
      {{ productionQueue?.length }}
    </div>
    <Swiper :modules="modules" :slides-per-view="3" :space-between="50" navigation :scrollbar="{ draggable: true }"
      :pagination="{ clickable: true }" class="flex w-full h-full space-x-12 p-12 justify-between">
      <SwiperSlide v-for="prod in productionQueue" :key="prod.el.id"
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
