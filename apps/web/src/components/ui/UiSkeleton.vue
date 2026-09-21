<script setup>
import {computed} from "vue";

const props = defineProps({
  width: {type: [String, Number], default: "100%"},
  height: {type: [String, Number], default: 16},
  radius: {type: [String, Number], default: ""},
  shape: {type: String, default: "default"},
  animated: {type: Boolean, default: true},
});

const cssValue = (value) => typeof value === "number" ? `${value}px` : value;
const skeletonStyle = computed(() => ({
  width: cssValue(props.width),
  height: cssValue(props.height),
  borderRadius: props.radius === "" ? undefined : cssValue(props.radius),
}));
</script>

<template>
  <span class="ui-skeleton" :class="[`ui-skeleton--${props.shape}`, {'ui-skeleton--animated': props.animated}]" :style="skeletonStyle" aria-hidden="true"></span>
</template>
