<script setup>
import SvgIcon from "@/components/SvgIcon.vue";
import UiEmptyState from "@/components/ui/UiEmptyState.vue";

defineProps({
  eyebrow: {type: String, default: "Mecorion"},
  title: {type: String, required: true},
  description: {type: String, required: true},
  icon: {type: String, default: "boxes"},
});
</script>

<template>
  <main class="mcrn-placeholder-page">
    <header class="mcrn-placeholder-page__header">
      <p>{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </header>

    <UiEmptyState
      class="mcrn-placeholder-page__empty"
      :title="`${title} — скоро`"
      :description="description"
      size="large"
    >
      <template #media><SvgIcon :name="icon" /></template>
    </UiEmptyState>
  </main>
</template>
