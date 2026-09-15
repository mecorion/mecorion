<script setup>
import {computed, useId} from "vue";

const props = defineProps({
  id: {type: String, default: ""},
  label: {type: String, default: ""},
  description: {type: String, default: ""},
  error: {type: String, default: ""},
  errors: {type: Array, default: () => []},
  orientation: {type: String, default: "vertical"},
  invalid: {type: Boolean, default: false},
});

const generatedId = useId();
const controlId = computed(() => props.id || generatedId);
const messages = computed(() => [props.error, ...props.errors.map((item) => typeof item === "string" ? item : item?.message)].filter(Boolean));
const isInvalid = computed(() => props.invalid || messages.value.length > 0);
</script>

<template>
  <div class="ui-field" :class="`ui-field--${props.orientation}`" role="group" :data-invalid="isInvalid || undefined">
    <label v-if="props.label || $slots.label" class="ui-field__label" :for="controlId">
      <slot name="label">{{ props.label }}</slot>
    </label>
    <div class="ui-field__content">
      <slot :id="controlId" :invalid="isInvalid" />
      <p v-if="props.description || $slots.description" class="ui-field__description">
        <slot name="description">{{ props.description }}</slot>
      </p>
      <div v-if="messages.length || $slots.error" class="ui-field__error" role="alert">
        <slot name="error">
          <span v-for="message in messages" :key="message">{{ message }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>
