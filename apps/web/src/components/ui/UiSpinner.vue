<script setup>
const props = defineProps({
  size: {type: String, default: "md"},
  label: {type: String, default: "Загрузка"},
  decorative: {type: Boolean, default: false},
});
</script>

<template>
  <span
    class="ui-spinner"
    :class="`ui-spinner--${props.size}`"
    :role="props.decorative ? undefined : 'status'"
    :aria-label="props.decorative ? undefined : props.label"
    :aria-hidden="props.decorative || undefined"
  ></span>
</template>
