<template>
  <RouterView />
</template>

<script setup>
import {useAppStore} from "@/stores/app.js";
import {onMounted} from "vue";
import {RouterView} from "vue-router";

const app = useAppStore();
onMounted(() => {
  app.initializeTheme();
});
</script>
