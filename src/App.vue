<template>
  <LoadingUI v-if="isLoading" />
  <MainLayout v-else />
</template>

<script setup>
import MainLayout from "./layouts/MainLayout.vue";
import {useAppStore} from "@/stores/app.js";
import {nextTick, onMounted, ref} from "vue";
import {useRequestsStore} from "@/stores/requests.js";
import LoadingUI from "@/components/LoadingUI.vue";
const app = useAppStore();
const requests = useRequestsStore()

const isLoading = ref(true);

onMounted(() => {
  app.initializeTheme()
})

onMounted(async () => {
  await requests.getContent()
  await nextTick()

  isLoading.value = false
})
</script>
