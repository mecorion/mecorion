<script setup>
import {computed, nextTick, onBeforeUnmount, ref, useId, watch} from "vue";

const model = defineModel({type: Boolean, default: false});
const props = defineProps({
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  side: {type: String, default: "bottom"},
  size: {type: String, default: ""},
  modal: {type: Boolean, default: true},
  dismissible: {type: Boolean, default: true},
  showHandle: {type: Boolean, default: true},
  showClose: {type: Boolean, default: true},
});

const panel = ref(null);
const titleId = useId();
const descriptionId = useId();
let previousFocus = null;
let previousOverflow = "";

const resolvedSide = computed(() => ({up: "top", down: "bottom"}[props.side] || props.side));
const isVertical = computed(() => ["top", "bottom"].includes(resolvedSide.value));
const panelStyle = computed(() => props.size ? {[isVertical.value ? "height" : "width"]: props.size} : undefined);

function open() {
  model.value = true;
}

function close() {
  model.value = false;
}

function requestClose() {
  if (props.dismissible) close();
}

function handleOverlay() {
  if (props.modal) requestClose();
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    requestClose();
    return;
  }
  if (!props.modal || event.key !== "Tab" || !panel.value) return;
  const focusable = [...panel.value.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) {
    event.preventDefault();
    panel.value.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(model, async (value) => {
  if (value) {
    previousFocus = document.activeElement;
    if (props.modal) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    await nextTick();
    const autofocus = panel.value?.querySelector("[autofocus]");
    (autofocus || panel.value)?.focus();
  } else {
    if (props.modal) document.body.style.overflow = previousOverflow;
    previousFocus?.focus?.();
  }
});

onBeforeUnmount(() => {
  if (model.value && props.modal) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <slot name="trigger" :open="open" :is-open="model" />
  <Teleport to="body">
    <Transition name="ui-drawer">
      <div v-if="model" class="ui-drawer" :class="{'ui-drawer--modal': props.modal}" @keydown="handleKeydown">
        <div v-if="props.modal" class="ui-drawer__overlay" aria-hidden="true" @click="handleOverlay"></div>
        <section
          ref="panel"
          class="ui-drawer__panel"
          :class="`ui-drawer__panel--${resolvedSide}`"
          :style="panelStyle"
          role="dialog"
          :aria-modal="props.modal || undefined"
          :aria-labelledby="props.title || $slots.title ? titleId : undefined"
          :aria-describedby="props.description || $slots.description ? descriptionId : undefined"
          tabindex="-1"
        >
          <div v-if="props.showHandle && isVertical" class="ui-drawer__handle" aria-hidden="true"></div>
          <header v-if="props.title || props.description || $slots.title || $slots.description || props.showClose" class="ui-drawer__header">
            <div class="ui-drawer__heading">
              <h2 v-if="props.title || $slots.title" :id="titleId" class="ui-drawer__title"><slot name="title">{{ props.title }}</slot></h2>
              <p v-if="props.description || $slots.description" :id="descriptionId" class="ui-drawer__description"><slot name="description">{{ props.description }}</slot></p>
            </div>
            <button v-if="props.showClose" class="ui-drawer__close" type="button" aria-label="Закрыть" @click="close">×</button>
          </header>
          <div class="ui-drawer__content"><slot :close="close" /></div>
          <footer v-if="$slots.footer" class="ui-drawer__footer"><slot name="footer" :close="close" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
