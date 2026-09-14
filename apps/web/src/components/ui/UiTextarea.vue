<script setup>
import {useId} from "vue";

defineOptions({inheritAttrs: false});

const model = defineModel({type: String, default: ""});
const props = defineProps({
  label: {type: String, default: ""},
  hint: {type: String, default: ""},
  success: {type: String, default: ""},
  danger: {type: String, default: ""},
  id: {type: String, default: ""},
});
const controlId = props.id || useId();
const messageId = `${controlId}-message`;
</script>

<template>
  <label class="mc-field" :for="controlId">
    <span v-if="props.label" class="mc-field__label">{{ props.label }}</span>
    <textarea v-bind="$attrs" :id="controlId" v-model="model" class="mc-field__control ui-textarea" :class="{'ui-textarea--danger': props.danger, 'ui-textarea--success': props.success && !props.danger}" :aria-invalid="Boolean(props.danger)" :aria-describedby="props.danger || props.success || props.hint ? messageId : undefined"></textarea>
    <span v-if="props.danger || props.success || props.hint" :id="messageId" class="ui-field-message" :class="{'ui-field-message--error': props.danger, 'ui-field-message--success': props.success && !props.danger}">{{ props.danger || props.success || props.hint }}</span>
  </label>
</template>
