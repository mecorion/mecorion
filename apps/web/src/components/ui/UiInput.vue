<script setup>
import {useId, useSlots} from "vue";

defineOptions({inheritAttrs: false});

const model = defineModel({type: [String, Number], default: ""});
const props = defineProps({
  label: {type: String, default: ""},
  hint: {type: String, default: ""},
  error: {type: String, default: ""},
  success: {type: String, default: ""},
  size: {type: String, default: "lg"},
  id: {type: String, default: ""},
});
const slots = useSlots();
const generatedId = useId();
const controlId = props.id || generatedId;
const messageId = `${controlId}-message`;
</script>

<template>
  <label class="mc-field" :for="controlId">
    <span v-if="props.label" class="mc-field__label">{{ props.label }}</span>
    <span class="ui-input__control" :class="[`ui-input__control--${props.size}`, {'ui-input__control--error': props.error, 'ui-input__control--success': props.success && !props.error}]">
      <span v-if="slots.prefix" class="ui-input__adornment ui-input__adornment--prefix"><slot name="prefix" /></span>
      <input v-bind="$attrs" :id="controlId" v-model="model" class="mc-field__control ui-input__native" :aria-invalid="Boolean(props.error)" :aria-describedby="props.error || props.success || props.hint ? messageId : undefined" />
      <span v-if="slots.suffix" class="ui-input__adornment ui-input__adornment--suffix"><slot name="suffix" /></span>
    </span>
    <span v-if="props.error || props.success || props.hint" :id="messageId" class="ui-field-message" :class="{'ui-field-message--error': props.error, 'ui-field-message--success': props.success && !props.error}">
      {{ props.error || props.success || props.hint }}
    </span>
  </label>
</template>
