<script setup>
import {computed} from "vue";
import UiAlert from "./UiAlert.vue";

defineOptions({inheritAttrs: false});

const props = defineProps({
  loading: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
  error: {type: String, default: ""},
  errors: {type: Array, default: () => []},
  errorTitle: {type: String, default: "Не удалось отправить форму"},
  spacing: {type: String, default: "default"},
});

const emit = defineEmits(["submit"]);
const messages = computed(() => [props.error, ...props.errors.map((item) => typeof item === "string" ? item : item?.message)].filter(Boolean));
const isDisabled = computed(() => props.disabled || props.loading);

function handleSubmit(event) {
  if (isDisabled.value) return;
  emit("submit", event);
}
</script>

<template>
  <form v-bind="$attrs" class="ui-form" :class="`ui-form--${props.spacing}`" :aria-busy="props.loading || undefined" @submit.prevent="handleSubmit">
    <header v-if="$slots.header" class="ui-form__header"><slot name="header" /></header>
    <UiAlert v-if="messages.length || $slots.error" class="ui-form__error" variant="danger" :title="props.errorTitle">
      <slot name="error"><span v-for="message in messages" :key="message">{{ message }}</span></slot>
    </UiAlert>
    <fieldset class="ui-form__fieldset" :disabled="isDisabled">
      <div class="ui-form__content"><slot :loading="props.loading" :disabled="isDisabled" /></div>
      <div v-if="$slots.actions" class="ui-form__actions"><slot name="actions" :loading="props.loading" :disabled="isDisabled" /></div>
    </fieldset>
    <footer v-if="$slots.footer" class="ui-form__footer"><slot name="footer" /></footer>
  </form>
</template>
