<script setup>
const props = defineProps({
  count: {type: [String, Number], default: ""},
  size: {type: String, default: "default"},
  label: {type: String, default: "Дополнительные пользователи"},
});
</script>

<template>
  <span class="ui-avatar ui-avatar-group-count" :class="`ui-avatar--${props.size}`" :aria-label="props.label">
    <slot>+{{ props.count }}</slot>
  </span>
</template>
