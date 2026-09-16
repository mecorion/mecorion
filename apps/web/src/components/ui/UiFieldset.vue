<script setup>
const props = defineProps({
  legend: {type: String, default: ""},
  description: {type: String, default: ""},
  legendVariant: {type: String, default: "legend"},
  disabled: {type: Boolean, default: false},
});
</script>

<template>
  <fieldset class="ui-fieldset" :disabled="props.disabled">
    <legend v-if="props.legend || $slots.legend" class="ui-fieldset__legend" :class="`ui-fieldset__legend--${props.legendVariant}`">
      <slot name="legend">{{ props.legend }}</slot>
    </legend>
    <p v-if="props.description || $slots.description" class="ui-fieldset__description">
      <slot name="description">{{ props.description }}</slot>
    </p>
    <slot />
  </fieldset>
</template>
