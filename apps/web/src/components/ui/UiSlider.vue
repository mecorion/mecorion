<script setup>
import {computed} from "vue";

defineOptions({inheritAttrs: false});

const model = defineModel({type: [Number, Array], default: 0});
const props = defineProps({
  min: {type: Number, default: 0},
  max: {type: Number, default: 100},
  step: {type: Number, default: 1},
  orientation: {type: String, default: "horizontal"},
  label: {type: String, default: "Slider"},
  disabled: {type: Boolean, default: false},
});

const values = computed(() => {
  const current = Array.isArray(model.value) ? model.value : [model.value];
  return current.map((value) => Math.min(props.max, Math.max(props.min, Number(value))));
});
const percentage = (value) => props.max === props.min ? 0 : ((value - props.min) / (props.max - props.min)) * 100;
const rangeStyle = computed(() => {
  const positions = values.value.map(percentage);
  const start = positions.length > 1 ? Math.min(...positions) : 0;
  const end = Math.max(...positions);
  return {"--ui-slider-start": `${start}%`, "--ui-slider-end": `${end}%`};
});

function setValue(index, nextValue) {
  if (!Array.isArray(model.value)) {
    model.value = nextValue;
    return;
  }

  const next = [...values.value];
  const lowerBound = index > 0 ? next[index - 1] : props.min;
  const upperBound = index < next.length - 1 ? next[index + 1] : props.max;
  next[index] = Math.min(upperBound, Math.max(lowerBound, nextValue));
  model.value = next;
}

function updateValue(index, event) {
  setValue(index, Number(event.target.value));
}

function handleTrackPointer(event) {
  if (props.disabled || event.target.classList?.contains("ui-slider__input")) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = props.orientation === "vertical"
    ? (rect.bottom - event.clientY) / rect.height
    : (event.clientX - rect.left) / rect.width;
  const rawValue = props.min + Math.min(1, Math.max(0, ratio)) * (props.max - props.min);
  const nextValue = Number((props.min + Math.round((rawValue - props.min) / props.step) * props.step).toFixed(10));
  const closestIndex = values.value.reduce((closest, value, index) => Math.abs(value - nextValue) < Math.abs(values.value[closest] - nextValue) ? index : closest, 0);
  setValue(closestIndex, nextValue);
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ui-slider"
    :class="[`ui-slider--${props.orientation}`, {'ui-slider--disabled': props.disabled}]"
    :style="rangeStyle"
    :data-disabled="props.disabled || undefined"
    @pointerdown="handleTrackPointer"
  >
    <span class="ui-slider__track" aria-hidden="true"><span class="ui-slider__range"></span></span>
    <input
      v-for="(value, index) in values"
      :key="index"
      class="ui-slider__input"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="value"
      :disabled="props.disabled"
      :aria-label="values.length > 1 ? `${props.label} ${index + 1}` : props.label"
      @input="updateValue(index, $event)"
    />
  </div>
</template>
