<script setup>
import {computed, ref, watch} from "vue";

const props = defineProps({
  src: {type: String, default: ""},
  alt: {type: String, default: ""},
  fallback: {type: String, default: ""},
  size: {type: String, default: "default"},
  status: {type: String, default: ""},
  interactive: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
});

const emit = defineEmits(["click"]);
const imageFailed = ref(false);
const componentTag = computed(() => props.interactive ? "button" : "span");

watch(() => props.src, () => { imageFailed.value = false; });
</script>

<template>
  <component
    :is="componentTag"
    class="ui-avatar"
    :class="[`ui-avatar--${props.size}`, {'ui-avatar--interactive': props.interactive}]"
    :type="props.interactive ? 'button' : undefined"
    :disabled="props.interactive && props.disabled"
    :role="props.interactive ? undefined : 'img'"
    :aria-label="props.alt || props.fallback || (props.interactive ? 'Профиль' : undefined)"
    @click="emit('click', $event)"
  >
    <img v-if="props.src && !imageFailed" class="ui-avatar__image" :src="props.src" alt="" @error="imageFailed = true" />
    <span v-else class="ui-avatar__fallback" aria-hidden="true"><slot>{{ props.fallback }}</slot></span>
    <span v-if="props.status || $slots.badge" class="ui-avatar__badge" :class="props.status && `ui-avatar__badge--${props.status}`" aria-hidden="true">
      <slot name="badge" />
    </span>
  </component>
</template>
