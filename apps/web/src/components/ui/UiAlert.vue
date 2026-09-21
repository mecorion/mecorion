<script setup>
const props = defineProps({
  variant: {type: String, default: "info"},
  title: {type: String, default: ""},
  icon: {type: Boolean, default: true},
  actionPosition: {type: String, default: "right"},
});
</script>

<template>
  <div
    class="ui-alert"
    :class="[`ui-alert--${props.variant}`, `ui-alert--action-${props.actionPosition}`, {'ui-alert--without-icon': !props.icon}]"
    role="alert"
  >
    <div v-if="props.icon" class="ui-alert__icon" aria-hidden="true"><slot name="icon">!</slot></div>
    <div class="ui-alert__main">
      <strong v-if="props.title" class="ui-alert__title">{{ props.title }}</strong>
      <div class="ui-alert__content"><slot /></div>
      <div v-if="$slots.action && props.actionPosition === 'bottom'" class="ui-alert__action ui-alert__action--bottom"><slot name="action" /></div>
    </div>
    <div v-if="$slots.action && props.actionPosition === 'right'" class="ui-alert__action ui-alert__action--right"><slot name="action" /></div>
  </div>
</template>
