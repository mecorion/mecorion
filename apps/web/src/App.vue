<template>
  <RouterView v-slot="{Component}">
    <component :is="Component" v-if="usesAuthLayout" />
    <WorkspaceLayout v-else>
      <component :is="Component" />
    </WorkspaceLayout>
  </RouterView>
</template>

<script setup>
import {useAppStore} from "@/stores/app.js";
import {computed, onMounted} from "vue";
import {RouterView, useRoute} from "vue-router";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";

const app = useAppStore();
const route = useRoute();
const usesAuthLayout = computed(() => route.meta.authLayout === true);
onMounted(() => {
  app.initializeTheme();
});
</script>
