<script setup>
import {useId} from "vue";

const props = defineProps({
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  variant: {type: String, default: "default"},
  mediaVariant: {type: String, default: "default"},
  size: {type: String, default: "default"},
});

const titleId = useId();
const descriptionId = useId();
</script>

<template>
  <section
    class="ui-empty-state"
    :class="[`ui-empty-state--${props.variant}`, `ui-empty-state--${props.size}`]"
    :aria-labelledby="props.title || $slots.title ? titleId : undefined"
    :aria-describedby="props.description || $slots.description ? descriptionId : undefined"
  >
    <header class="ui-empty-state__header">
      <div v-if="$slots.media" class="ui-empty-state__media" :class="`ui-empty-state__media--${props.mediaVariant}`"><slot name="media" /></div>
      <h3 v-if="props.title || $slots.title" :id="titleId" class="ui-empty-state__title"><slot name="title">{{ props.title }}</slot></h3>
      <p v-if="props.description || $slots.description" :id="descriptionId" class="ui-empty-state__description"><slot name="description">{{ props.description }}</slot></p>
    </header>
    <div v-if="$slots.default || $slots.actions" class="ui-empty-state__content">
      <slot />
      <div v-if="$slots.actions" class="ui-empty-state__actions"><slot name="actions" /></div>
    </div>
    <footer v-if="$slots.footer" class="ui-empty-state__footer"><slot name="footer" /></footer>
  </section>
</template>
