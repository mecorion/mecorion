<script setup>
const model = defineModel({type: Boolean, default: false});
const props = defineProps({
  variant: {type: String, default: "default"},
  size: {type: String, default: "default"},
  disabled: {type: Boolean, default: false},
  type: {type: String, default: "button"},
});
</script>

<template>
  <button
    class="ui-toggle"
    :class="[`ui-toggle--${props.variant}`, `ui-toggle--${props.size}`]"
    :type="props.type"
    :aria-pressed="model"
    :data-state="model ? 'on' : 'off'"
    :disabled="props.disabled"
    @click="model = !model"
  >
    <slot />
  </button>
</template>
