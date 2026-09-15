<script setup>
import {computed, nextTick, onBeforeUnmount, ref, useId, watch} from "vue";

defineOptions({inheritAttrs: false});

const props = defineProps({
  content: {type: String, default: ""},
  side: {type: String, default: "top"},
  sideOffset: {type: Number, default: 8},
  delay: {type: Number, default: 300},
  open: {type: Boolean, default: undefined},
  disabled: {type: Boolean, default: false},
});

const emit = defineEmits(["update:open"]);
const trigger = ref(null);
const popup = ref(null);
const localOpen = ref(false);
const resolvedSide = ref(props.side);
const position = ref({top: "0px", left: "0px"});
const tooltipId = useId();
let openTimer;
let closeTimer;

const isOpen = computed(() => props.open === undefined ? localOpen.value : props.open);

function setOpen(value) {
  if (props.disabled) return;
  localOpen.value = value;
  emit("update:open", value);
}

function scheduleOpen() {
  clearTimeout(closeTimer);
  openTimer = setTimeout(() => setOpen(true), props.delay);
}

function scheduleClose() {
  clearTimeout(openTimer);
  closeTimer = setTimeout(() => setOpen(false), 80);
}

function updatePosition() {
  if (!trigger.value || !popup.value) return;
  const anchor = trigger.value.getBoundingClientRect();
  const floating = popup.value.getBoundingClientRect();
  const margin = 8;
  const spaces = {
    top: anchor.top,
    right: window.innerWidth - anchor.right,
    bottom: window.innerHeight - anchor.bottom,
    left: anchor.left,
  };
  const opposite = {top: "bottom", bottom: "top", left: "right", right: "left"};
  const required = ["top", "bottom"].includes(props.side) ? floating.height + props.sideOffset : floating.width + props.sideOffset;
  const side = spaces[props.side] >= required + margin ? props.side : spaces[opposite[props.side]] > spaces[props.side] ? opposite[props.side] : props.side;
  resolvedSide.value = side;

  let top = anchor.top + (anchor.height - floating.height) / 2;
  let left = anchor.left + (anchor.width - floating.width) / 2;
  if (side === "top") top = anchor.top - floating.height - props.sideOffset;
  if (side === "bottom") top = anchor.bottom + props.sideOffset;
  if (side === "left") left = anchor.left - floating.width - props.sideOffset;
  if (side === "right") left = anchor.right + props.sideOffset;

  position.value = {
    top: `${Math.max(margin, Math.min(top, window.innerHeight - floating.height - margin))}px`,
    left: `${Math.max(margin, Math.min(left, window.innerWidth - floating.width - margin))}px`,
  };
}

function handleKeydown(event) {
  if (event.key === "Escape") setOpen(false);
}

watch(isOpen, async (value) => {
  if (value) {
    await nextTick();
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", handleKeydown);
  } else {
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("keydown", handleKeydown);
  }
});

onBeforeUnmount(() => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <span
    ref="trigger"
    v-bind="$attrs"
    class="ui-tooltip__trigger"
    :aria-describedby="isOpen ? tooltipId : undefined"
    @mouseenter="scheduleOpen"
    @mouseleave="scheduleClose"
    @focusin="scheduleOpen"
    @focusout="scheduleClose"
  >
    <slot />
  </span>
  <Teleport to="body">
    <div
      v-if="isOpen"
      :id="tooltipId"
      ref="popup"
      class="ui-tooltip__content"
      :class="`ui-tooltip__content--${resolvedSide}`"
      :style="position"
      role="tooltip"
      @mouseenter="clearTimeout(closeTimer)"
      @mouseleave="scheduleClose"
    >
      <span><slot name="content">{{ props.content }}</slot></span>
      <kbd v-if="$slots.shortcut" class="ui-tooltip__shortcut"><slot name="shortcut" /></kbd>
    </div>
  </Teleport>
</template>
