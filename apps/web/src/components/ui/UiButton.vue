<script setup>
import {computed, resolveComponent} from "vue";

const props = defineProps({
  variant: {type: String, default: "default"},
  size: {type: String, default: "md"},
  loading: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
  icon: {type: Boolean, default: false},
  rounded: {type: Boolean, default: false},
  type: {type: String, default: "button"},
  to: {type: [String, Object], default: ""},
  href: {type: String, default: ""},
  target: {type: String, default: ""},
  rel: {type: String, default: ""},
});

const isLink = computed(() => Boolean(props.to || props.href));
const componentTag = computed(() => {
  if (props.to) return resolveComponent("NuxtLink");
  if (props.href) return "a";
  return "button";
});
const linkRel = computed(() => props.rel || (props.target === "_blank" ? "noopener noreferrer" : undefined));

function handleClick(event) {
  if (props.disabled || props.loading) event.preventDefault();
}
</script>

<template>
  <component
    :is="componentTag"
    class="mc-button"
    :class="[
      `mc-button--${props.variant}`,
      props.size !== 'md' && `mc-button--${props.size}`,
      {'mc-button--icon': props.icon, 'mc-button--rounded': props.rounded, 'mc-button--link': isLink},
    ]"
    :type="isLink ? undefined : props.type"
    :disabled="!isLink && (props.disabled || props.loading)"
    :to="props.to || undefined"
    :href="props.href || undefined"
    :target="isLink ? props.target || undefined : undefined"
    :rel="isLink ? linkRel : undefined"
    :aria-disabled="isLink && (props.disabled || props.loading) || undefined"
    :tabindex="isLink && (props.disabled || props.loading) ? -1 : undefined"
    :aria-busy="props.loading || undefined"
    @click="handleClick"
  >
    <span v-if="props.loading" class="ui-spinner" aria-hidden="true"></span>
    <slot />
  </component>
</template>
