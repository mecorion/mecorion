<script setup>
const props = defineProps({
  variant: {type: String, default: "default"},
  size: {type: String, default: "md"},
  loading: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
  type: {type: String, default: "button"},
});
</script>

<template>
  <button
    class="mc-button"
    :class="[`mc-button--${props.variant}`, props.size !== 'md' && `mc-button--${props.size}`]"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
  >
    <span v-if="props.loading" class="ui-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
