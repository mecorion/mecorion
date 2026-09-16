<script setup>
const props = defineProps({
  eyebrow: {type: String, default: ""},
  title: {type: [String, Number], default: ""},
  titleTag: {type: String, default: "h2"},
  eyebrowClass: {type: [String, Array, Object], default: "workspace-eyebrow"},
  titleClass: {type: [String, Array, Object], default: ""},
});
</script>

<template>
  <header class="layout-section-header">
    <div class="layout-section-header__copy">
      <p v-if="props.eyebrow || $slots.eyebrow" :class="props.eyebrowClass"><slot name="eyebrow">{{ props.eyebrow }}</slot></p>
      <component :is="props.titleTag" :class="props.titleClass"><slot name="title">{{ props.title }}</slot></component>
      <slot name="description" />
    </div>
    <div v-if="$slots.action" class="layout-section-header__action"><slot name="action" /></div>
  </header>
</template>
