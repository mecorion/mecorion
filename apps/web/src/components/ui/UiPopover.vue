<script setup>
import {computed, nextTick, onBeforeUnmount, ref, useId, watch} from "vue";

const model = defineModel({type: Boolean, default: false});
const props = defineProps({
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
const titleId = useId();
const descriptionId = useId();

const contentStyle = computed(() => ({
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
  const opposite = {top: "bottom", bottom: "top", left: "right", right: "left"};
  let side = props.side;
  let point = coordinates(side, trigger, panel);
  const overflows = {
    top: point.top < viewportPadding,
    bottom: point.top + panel.height > window.innerHeight - viewportPadding,
    left: point.left < viewportPadding,
    right: point.left + panel.width > window.innerWidth - viewportPadding,
  };
  if (overflows[side]) {
    const flipped = opposite[side];
    const flippedPoint = coordinates(flipped, trigger, panel);
    const fits = flipped === "top" ? flippedPoint.top >= viewportPadding
      : flipped === "bottom" ? flippedPoint.top + panel.height <= window.innerHeight - viewportPadding
        : flipped === "left" ? flippedPoint.left >= viewportPadding
          : flippedPoint.left + panel.width <= window.innerWidth - viewportPadding;
    if (fits) {
      side = flipped;
      point = flippedPoint;
    }
  }
  resolvedSide.value = side;
  position.value = {
    top: Math.max(viewportPadding, Math.min(point.top, window.innerHeight - panel.height - viewportPadding)),
    left: Math.max(viewportPadding, Math.min(point.left, window.innerWidth - panel.width - viewportPadding)),
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
});

watch(() => [props.side, props.align, props.offset, props.width, props.matchTriggerWidth], async () => {
  if (!model.value) return;
  await nextTick();
  updatePosition();
});

onBeforeUnmount(removeListeners);
</script>

<template>
  <span ref="anchor" class="ui-popover__anchor"><slot name="trigger" :open="open" :close="close" :toggle="toggle" :is-open="model" /></span>
  <Teleport to="body">
    <Transition name="ui-popover">
      <section
        v-if="model"
        ref="content"
        class="ui-popover"
        :class="`ui-popover--${resolvedSide}`"
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
