<script setup>
import {computed, nextTick, ref, useId, useSlots, useAttrs} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";

defineOptions({inheritAttrs: false});

const model = defineModel({type: [String, Number], default: ""});
const emit = defineEmits(["clear"]);
const props = defineProps({
  label: {type: String, default: ""},
  hint: {type: String, default: ""},
  error: {type: String, default: ""},
  success: {type: String, default: ""},
  size: {type: String, default: "lg"},
  id: {type: String, default: ""},
  clearable: {type: Boolean, default: false},
});
const attrs = useAttrs();
const input = ref(null);
const canClear = computed(() => props.clearable && String(model.value ?? "").length > 0 && attrs.disabled === undefined && attrs.readonly === undefined);
async function clear() {
  model.value = "";
  emit("clear");
  await nextTick();
  input.value?.focus();
}
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
      <input v-bind="$attrs" :id="controlId" ref="input" v-model="model" class="mc-field__control ui-input__native" :aria-invalid="Boolean(props.error)" :aria-describedby="props.error || props.success || props.hint ? messageId : undefined" />
      <span v-if="slots.suffix" class="ui-input__adornment ui-input__adornment--suffix"><slot name="suffix" /></span>
      <button v-if="canClear" class="ui-input__clear" type="button" :aria-label="props.label ? `Очистить поле «${props.label}»` : 'Очистить поле'" @pointerdown.prevent @click.stop.prevent="clear"><SvgIcon name="x" /></button>
    </span>
    <span v-if="props.error || props.success || props.hint" :id="messageId" class="ui-field-message" :class="{'ui-field-message--error': props.error, 'ui-field-message--success': props.success && !props.error}">
      {{ props.error || props.success || props.hint }}
    </span>
  </label>
</template>
