<script setup>
import {computed} from "vue";

const props = defineProps({
  steps: {type: Array, required: true},
  current: {type: Number, default: 1},
  label: {type: String, default: "Этапы"},
});

const activeStep = computed(() => Math.min(Math.max(Math.trunc(props.current) || 1, 1), props.steps.length));
</script>

<template>
  <nav class="ui-steps" :aria-label="props.label" :style="{'--ui-steps-segments': Math.max(props.steps.length - 1, 0)}">
    <ol class="ui-steps__list">
      <li
        v-for="(item, index) in props.steps"
        :key="index"
        class="ui-steps__item"
        :class="{'ui-steps__item--current': index + 1 === activeStep, 'ui-steps__item--complete': index + 1 < activeStep}"
        :aria-current="index + 1 === activeStep ? 'step' : undefined"
      >
        <span class="ui-steps__marker" aria-hidden="true"></span>
        <span class="ui-steps__label">{{ typeof item === 'string' ? item : item.label }}</span>
      </li>
    </ol>
    <span class="ui-steps__sr-only" role="status">Шаг {{ activeStep }} из {{ props.steps.length }}: {{ typeof props.steps[activeStep - 1] === 'string' ? props.steps[activeStep - 1] : props.steps[activeStep - 1]?.label }}</span>
  </nav>
</template>
