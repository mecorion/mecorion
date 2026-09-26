<script setup lang="ts">
import {computed} from "vue";

const props = defineProps<{name: string; title?: string}>();
const symbolId = computed(() => `#icon-${props.name}`);
</script>

<template>
  <svg class="svg-icon" :aria-hidden="title ? undefined : 'true'" :role="title ? 'img' : undefined">
    <title v-if="title">{{ title }}</title>
    <use :href="symbolId" />
  </svg>
</template>
