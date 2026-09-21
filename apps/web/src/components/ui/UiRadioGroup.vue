<script setup>
import {useId} from "vue";

const model = defineModel({type: [String, Number, Boolean], default: ""});
const props = defineProps({
  options: {type: Array, default: () => []},
  label: {type: String, default: ""},
  description: {type: String, default: ""},
  invalid: {type: String, default: ""},
  name: {type: String, default: ""},
  variant: {type: String, default: "default"},
  orientation: {type: String, default: "vertical"},
  disabled: {type: Boolean, default: false},
});

const generatedId = useId();
const groupName = props.name || generatedId;
const descriptionId = `${generatedId}-description`;
const messageId = `${generatedId}-message`;
</script>

<template>
  <fieldset
    class="ui-radio-group"
    :class="[`ui-radio-group--${props.variant}`, `ui-radio-group--${props.orientation}`, {'ui-radio-group--invalid': props.invalid}]"
    :disabled="props.disabled"
    :aria-invalid="Boolean(props.invalid)"
    :aria-describedby="props.invalid ? messageId : props.description ? descriptionId : undefined"
    :data-invalid="props.invalid || undefined"
    :data-disabled="props.disabled || undefined"
  >
    <legend v-if="props.label" class="ui-radio-group__legend">{{ props.label }}</legend>
    <p v-if="props.description" :id="descriptionId" class="ui-radio-group__description">{{ props.description }}</p>
    <div class="ui-radio-group__items">
      <label v-for="option in props.options" :key="String(option.value)" class="ui-radio-group__item" :class="{'ui-radio-group__item--disabled': option.disabled}">
        <input
          v-model="model"
          class="ui-radio-group__control"
          type="radio"
          :name="groupName"
          :value="option.value"
          :disabled="props.disabled || option.disabled"
          :aria-invalid="Boolean(props.invalid)"
        />
        <span class="ui-radio-group__copy">
          <strong>{{ option.label }}</strong>
          <small v-if="option.description">{{ option.description }}</small>
        </span>
      </label>
    </div>
    <span v-if="props.invalid" :id="messageId" class="ui-field-message ui-field-message--error">{{ props.invalid }}</span>
  </fieldset>
</template>
