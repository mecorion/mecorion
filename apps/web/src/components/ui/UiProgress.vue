<script setup>
import {computed, useSlots} from "vue";

const props = defineProps({
  value: {type: Number, default: 0},
  min: {type: Number, default: 0},
  max: {type: Number, default: 100},
  size: {type: String, default: "default"},
  label: {type: String, default: ""},
  showValue: {type: Boolean, default: false},
  formatValue: {type: Function, default: null},
});

const slots = useSlots();
const normalizedValue = computed(() => Math.min(props.max, Math.max(props.min, props.value)));
const percentage = computed(() => props.max === props.min ? 0 : ((normalizedValue.value - props.min) / (props.max - props.min)) * 100);
const displayValue = computed(() => props.formatValue ? props.formatValue(normalizedValue.value, percentage.value) : `${Math.round(percentage.value)}%`);
const hasMeta = computed(() => Boolean(props.label || props.showValue || slots.label || slots.value));
</script>

<template>
  <div class="ui-progress" :class="`ui-progress--${props.size}`">
    <div v-if="hasMeta" class="ui-progress__meta">
      <span class="ui-progress__label"><slot name="label">{{ props.label }}</slot></span>
      <strong class="ui-progress__value"><slot name="value" :value="normalizedValue" :percentage="percentage">{{ displayValue }}</slot></strong>
    </div>
    <div
      class="ui-progress__track"
      role="progressbar"
      :aria-label="props.label || 'Progress'"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-valuenow="normalizedValue"
      :aria-valuetext="displayValue"
    >
      <span class="ui-progress__indicator" :style="{width: `${percentage}%`}"></span>
    </div>
  </div>
</template>
