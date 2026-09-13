<script setup>
import {computed} from "vue";

const props = defineProps({
  name: {type: String, required: true},
  title: {type: String, default: ""},
});

const symbolId = computed(() => `#icon-${props.name}`);
</script>

<template>
  <svg class="svg-icon" :aria-hidden="title ? undefined : 'true'" :role="title ? 'img' : undefined">
    <title v-if="title">{{ title }}</title>
    <use :href="symbolId" />
  </svg>
</template>
