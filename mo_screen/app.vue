<script lang="ts" setup>
const col_a_text = () => useState('col_a')
const { data: response } = await useFetch('https://0.0.0.0/version')

</script>

<template>
  <div class="flex space-x-12 p-12 justify-between">
    <div class="flex flex-col w-full h-full bg-rose-200">
      col a
      {{ col_a_text }}
    </div>
    <div class="flex flex-col w-full h-full bg-amber-200">
      col b
    </div>
    <div class="flex flex-col w-full h-full bg-emerald-200">
      col c
    </div>
  </div>
</template>
