<script setup>
import {computed, resolveComponent, useSlots} from "vue";

defineOptions({inheritAttrs: false});

const props = defineProps({
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  variant: {type: String, default: "default"},
  size: {type: String, default: "default"},
  mediaVariant: {type: String, default: "default"},
  to: {type: [String, Object], default: ""},
  href: {type: String, default: ""},
  target: {type: String, default: ""},
  as: {type: String, default: "div"},
  type: {type: String, default: "button"},
  disabled: {type: Boolean, default: false},
});

const slots = useSlots();
const isLink = computed(() => Boolean(props.to || props.href));
const componentTag = computed(() => props.to ? resolveComponent("NuxtLink") : props.href ? "a" : props.as);
const linkRel = computed(() => props.target === "_blank" ? "noopener noreferrer" : undefined);
const hasContent = computed(() => Boolean(props.title || props.description || slots.default));

function handleClick(event) {
  if (props.disabled) event.preventDefault();
}
</script>

<template>
  <component
    :is="componentTag"
    v-bind="$attrs"
    class="ui-item"
    :class="[`ui-item--${props.variant}`, `ui-item--${props.size}`, {'ui-item--link': isLink, 'ui-item--disabled': props.disabled}]"
    :to="props.to || undefined"
    :href="props.href || undefined"
    :target="isLink ? props.target || undefined : undefined"
    :rel="isLink ? linkRel : undefined"
    :type="props.as === 'button' && !isLink ? props.type : undefined"
    :aria-disabled="props.disabled || undefined"
    :tabindex="props.disabled ? -1 : undefined"
    @click="handleClick"
  >
    <header v-if="$slots.header" class="ui-item__header"><slot name="header" /></header>
    <div class="ui-item__body">
      <div v-if="$slots.media" class="ui-item__media" :class="`ui-item__media--${props.mediaVariant}`"><slot name="media" /></div>
      <div v-if="hasContent" class="ui-item__content">
        <strong v-if="props.title || $slots.title" class="ui-item__title"><slot name="title">{{ props.title }}</slot></strong>
        <p v-if="props.description || $slots.description" class="ui-item__description"><slot name="description">{{ props.description }}</slot></p>
        <slot />
      </div>
      <div v-if="$slots.actions" class="ui-item__actions"><slot name="actions" /></div>
    </div>
    <footer v-if="$slots.footer" class="ui-item__footer"><slot name="footer" /></footer>
  </component>
</template>
