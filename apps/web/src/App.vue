<template>
  <LoadingUI v-if="isLoading" />
  <RouterView v-else-if="isWorkspace" />
  <MainLayout v-else />
</template>

<script setup>
import MainLayout from "./layouts/MainLayout.vue";
import {useAppStore} from "@/stores/app.js";
import {computed, onMounted, ref, watch} from "vue";
import {useRequestsStore} from "@/stores/requests.js";
import LoadingUI from "@/components/LoadingUI.vue";
import {RouterView, useRoute} from "vue-router";

const app = useAppStore();
const requests = useRequestsStore();
const route = useRoute();

const isLoading = ref(true);
const isWorkspace = computed(() => route.meta.workspace === true);

onMounted(() => {
  app.initializeTheme();
});

watch(
  () => route.meta.needsContent,
  async (needsContent) => {
    isLoading.value = true;

    if (needsContent && !requests.content.length) {
      await requests.getContent();
    }

    isLoading.value = false;
  },
  {immediate: true},
);
</script>
