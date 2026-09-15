<script setup>
import {ref, watchEffect} from "vue";

defineOptions({inheritAttrs: false});

const model = defineModel({type: [Boolean, Array], default: false});
const props = defineProps({
  label: {type: String, default: ""},
  description: {type: String, default: ""},
  value: {type: [String, Number, Boolean], default: undefined},
  invalid: {type: Boolean, default: false},
  indeterminate: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
});

const input = ref(null);

watchEffect(() => {
  if (input.value) input.value.indeterminate = props.indeterminate;
});
</script>

<template>
  <label
    class="mc-checkbox ui-checkbox"
    :class="{'ui-checkbox--invalid': props.invalid, 'ui-checkbox--disabled': props.disabled}"
    :data-invalid="props.invalid || undefined"
    :data-disabled="props.disabled || undefined"
  >
    <input
      ref="input"
      v-bind="$attrs"
      v-model="model"
      type="checkbox"
      :value="props.value"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
    />
    <span class="ui-checkbox__control" aria-hidden="true">
      <svg v-if="props.indeterminate" viewBox="0 0 12 12"><path d="M2.5 6h7" /></svg>
      <svg v-else viewBox="0 0 12 12"><path d="m2.5 6 2.2 2.2 4.8-4.8" /></svg>
    </span>
    <span v-if="props.label || props.description || $slots.default" class="ui-checkbox__copy">
      <strong v-if="props.label">{{ props.label }}</strong>
      <slot />
      <small v-if="props.description">{{ props.description }}</small>
    </span>
  </label>
</template>
