<script lang="ts" setup>
import { ref } from '../.nuxt/imports'
const emit = defineEmits<{
  (e: 'login', data: { user: string, password: string }): void
}>()
const user = ref('')
const password = ref('')
function submit(event) {
  event.preventDefault()
  let data = {
    user: user.value,
    password: password.value
  }
  emit('login', data)
}
</script>

<template>
  <div class="h-full w-full flex flex-col justify-center items-center space-y-0">
    <form class="h-full w-25 flex flex-col justify-center items-center space-y-0" @submit="submit">
      <input placeholder="Usuario" v-model="user" class="text-center rounded-t-md border border-b-0 p-2" type="text" />
      <input placeholder="Password" v-model="password" class="text-center border border-b-0 p-2 h-auto" type="password" />
      <button class="bg-gray-100 font-bold rounded-b-md border p-2 h-auto w-full hover:bg-gray-200 btn" type="submit">
        Login
      </button>
    </form>
  </div>
</template>
