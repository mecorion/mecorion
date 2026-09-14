<script setup>
const props = defineProps({variant: {type: String, default: "default"}, interactive: {type: Boolean, default: false}});
</script>

<template>
  <article class="mc-card" :class="[`mc-card--${props.variant}`, {'mc-card--interactive': props.interactive}]">
    <header v-if="$slots.header" class="ui-card__header"><slot name="header" /></header>
    <div class="mc-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="mc-card__footer"><slot name="footer" /></footer>
  </article>
</template>
