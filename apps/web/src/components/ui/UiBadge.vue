<script setup>
import {computed, resolveComponent} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import UiSpinner from "./UiSpinner.vue";

const props = defineProps({
  variant: {type: String, default: "default"},
  to: {type: [String, Object], default: ""},
  href: {type: String, default: ""},
  loading: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
});

const componentTag = computed(() => {
  if (props.to) return resolveComponent("NuxtLink");
  if (props.href) return "a";
  return "span";
});
const isLink = computed(() => Boolean(props.to || props.href));

function handleClick(event) {
  if (props.disabled || props.loading) event.preventDefault();
}
</script>

<template>
  <component
    :is="componentTag"
    class="ui-badge"
    :class="[`ui-badge--${props.variant}`, {'ui-badge--link': isLink, 'ui-badge--loading': props.loading, 'ui-badge--disabled': props.disabled}]"
    :to="props.to || undefined"
    :href="props.href || undefined"
    :aria-busy="props.loading || undefined"
    :aria-disabled="(props.disabled || props.loading) || undefined"
    :tabindex="props.disabled || props.loading ? -1 : undefined"
    @click="handleClick"
  >
    <UiSpinner v-if="props.loading" class="ui-badge__spinner" size="sm" decorative />
    <slot />
    <SvgIcon v-if="isLink" class="ui-badge__link-icon" name="arrow-up-right-1" />
  </component>
</template>
