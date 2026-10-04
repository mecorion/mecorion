<script setup>
import {computed, nextTick, onBeforeUnmount, ref, useId, watch} from "vue";

const model = defineModel({type: Boolean, default: false});
const props = defineProps({
  autoFocus: {type: Boolean, default: false},
  teleport: {type: Boolean, default: true},
  boundary: {type: Object, default: null},
  panelClass: {type: [String, Array, Object], default: ""},
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  side: {type: String, default: "bottom"},
  align: {type: String, default: "center"},
  offset: {type: Number, default: 8},
  width: {type: String, default: ""},
  matchTriggerWidth: {type: Boolean, default: false},
  dismissible: {type: Boolean, default: true},
});

const anchor = ref(null);
const content = ref(null);
const position = ref({top: 0, left: 0});
const resolvedSide = ref(props.side);
const maxHeight = ref(null);
let resizeObserver = null;
const titleId = useId();
const descriptionId = useId();

const contentStyle = computed(() => ({
  position: props.teleport ? "fixed" : "absolute",
  maxHeight: maxHeight.value === null ? undefined : `${maxHeight.value}px`,
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  width: props.matchTriggerWidth && anchor.value ? `${anchor.value.getBoundingClientRect().width}px` : props.width || undefined,
}));

function open() {
  model.value = true;
}

function close({restoreFocus = false} = {}) {
  model.value = false;
  if (restoreFocus) anchor.value?.querySelector("button, a, input, [tabindex]")?.focus?.();
}

function toggle() {
  model.value = !model.value;
}

function alignedCrossPosition(trigger, panel, side) {
  const horizontal = side === "top" || side === "bottom";
  const triggerStart = horizontal ? trigger.left : trigger.top;
  const triggerSize = horizontal ? trigger.width : trigger.height;
  const panelSize = horizontal ? panel.width : panel.height;
  if (props.align === "start") return triggerStart;
  if (props.align === "end") return triggerStart + triggerSize - panelSize;
  return triggerStart + (triggerSize - panelSize) / 2;
}

function coordinates(side, trigger, panel) {
  const cross = alignedCrossPosition(trigger, panel, side);
  if (side === "top") return {top: trigger.top - panel.height - props.offset, left: cross};
  if (side === "left") return {top: cross, left: trigger.left - panel.width - props.offset};
  if (side === "right") return {top: cross, left: trigger.right + props.offset};
  return {top: trigger.bottom + props.offset, left: cross};
}

function updatePosition() {
  if (!anchor.value || !content.value) return;
  const trigger = anchor.value.getBoundingClientRect();
  const panel = content.value.getBoundingClientRect();
  const viewportPadding = 8;
  const boundary = props.boundary?.getBoundingClientRect();
  const bounds = {
    top: Math.max(0, boundary?.top ?? 0),
    left: Math.max(0, boundary?.left ?? 0),
    right: Math.min(window.innerWidth, boundary?.right ?? window.innerWidth),
    bottom: Math.min(window.innerHeight, boundary?.bottom ?? window.innerHeight),
  };
  maxHeight.value = Math.max(0, bounds.bottom - bounds.top - viewportPadding * 2);
  const opposite = {top: "bottom", bottom: "top", left: "right", right: "left"};
  let side = props.side;
  let point = coordinates(side, trigger, panel);
  const overflows = {
    top: point.top < bounds.top + viewportPadding,
    bottom: point.top + panel.height > bounds.bottom - viewportPadding,
    left: point.left < bounds.left + viewportPadding,
    right: point.left + panel.width > bounds.right - viewportPadding,
  };
  if (overflows[side]) {
    const flipped = opposite[side];
    const flippedPoint = coordinates(flipped, trigger, panel);
    const fits = flipped === "top" ? flippedPoint.top >= bounds.top + viewportPadding
      : flipped === "bottom" ? flippedPoint.top + panel.height <= bounds.bottom - viewportPadding
        : flipped === "left" ? flippedPoint.left >= bounds.left + viewportPadding
          : flippedPoint.left + panel.width <= bounds.right - viewportPadding;
    if (fits) {
      side = flipped;
      point = flippedPoint;
    }
  }
  resolvedSide.value = side;
  const origin = !props.teleport ? content.value.offsetParent?.getBoundingClientRect() : null;
  position.value = {
    top: Math.max(bounds.top + viewportPadding, Math.min(point.top, bounds.bottom - panel.height - viewportPadding)) - (origin?.top ?? 0),
    left: Math.max(bounds.left + viewportPadding, Math.min(point.left, bounds.right - panel.width - viewportPadding)) - (origin?.left ?? 0),
  };
}

function handlePointerDown(event) {
  if (!props.dismissible || anchor.value?.contains(event.target) || content.value?.contains(event.target)) return;
  close();
}

function handleKeydown(event) {
  if (event.key === "Escape" && props.dismissible) {
    event.preventDefault();
    close({restoreFocus: true});
  }
}

function addListeners() {
  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
}

function removeListeners() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  document.removeEventListener("pointerdown", handlePointerDown);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
}

watch(model, async (value) => {
  removeListeners();
  if (!value) return;
  await nextTick();
  updatePosition();
  addListeners();
  resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(content.value);
  if (props.autoFocus) content.value.querySelector("button:not([disabled]), [tabindex]")?.focus();
});

watch(() => [props.side, props.align, props.offset, props.width, props.matchTriggerWidth, props.teleport, props.boundary], async () => {
  if (!model.value) return;
  await nextTick();
  updatePosition();
});

onBeforeUnmount(removeListeners);
</script>

<template>
  <span ref="anchor" class="ui-popover__anchor"><slot name="trigger" :open="open" :close="close" :toggle="toggle" :is-open="model" /></span>
  <Teleport to="body" :disabled="!props.teleport">
    <Transition name="ui-popover">
      <section
        v-if="model"
        ref="content"
        class="ui-popover"
        :class="[`ui-popover--${resolvedSide}`, props.panelClass]"
        :style="contentStyle"
        role="dialog"
        :aria-labelledby="props.title || $slots.title ? titleId : undefined"
        :aria-describedby="props.description || $slots.description ? descriptionId : undefined"
      >
        <header v-if="props.title || props.description || $slots.title || $slots.description" class="ui-popover__header">
          <h3 v-if="props.title || $slots.title" :id="titleId" class="ui-popover__title"><slot name="title">{{ props.title }}</slot></h3>
          <p v-if="props.description || $slots.description" :id="descriptionId" class="ui-popover__description"><slot name="description">{{ props.description }}</slot></p>
        </header>
        <div class="ui-popover__content"><slot :close="close" /></div>
      </section>
    </Transition>
  </Teleport>
</template>
