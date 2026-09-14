<script setup>
const props = defineProps({variant: {type: String, default: "info"}, title: {type: String, default: ""}});
</script>

<template>
  <div class="ui-alert" :class="`ui-alert--${props.variant}`" role="alert">
    <div class="ui-alert__icon" aria-hidden="true"><slot name="icon">!</slot></div>
    <div><strong v-if="props.title">{{ props.title }}</strong><div class="ui-alert__content"><slot /></div></div>
  </div>
</template>
