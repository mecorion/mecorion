<script setup>
import {computed, useSlots} from "vue";

defineOptions({inheritAttrs: false});

const props = defineProps({
  variant: {type: String, default: "default"},
  size: {type: String, default: "default"},
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  spacing: {type: String, default: ""},
  interactive: {type: Boolean, default: false},
});

const slots = useSlots();
const hasHeader = computed(() => Boolean(slots.header || slots.action || props.title || props.description));
const cardStyle = computed(() => props.spacing ? {"--mc-card-spacing": props.spacing} : undefined);
</script>

<template>
  <article
    v-bind="$attrs"
    class="mc-card ui-card"
    :class="[`mc-card--${props.variant}`, `ui-card--${props.size}`, {'mc-card--interactive': props.interactive}]"
    :data-size="props.size"
    :style="cardStyle"
  >
    <div v-if="$slots.media" class="ui-card__media"><slot name="media" /></div>
    <header v-if="hasHeader" class="ui-card__header">
      <div class="ui-card__heading">
        <slot name="header">
          <h3 v-if="props.title" class="ui-card__title">{{ props.title }}</h3>
          <p v-if="props.description" class="ui-card__description">{{ props.description }}</p>
        </slot>
      </div>
      <div v-if="$slots.action" class="ui-card__action"><slot name="action" /></div>
    </header>
    <div v-if="$slots.default" class="mc-card__body ui-card__content"><slot /></div>
    <footer v-if="$slots.footer" class="mc-card__footer ui-card__footer"><slot name="footer" /></footer>
  </article>
</template>
