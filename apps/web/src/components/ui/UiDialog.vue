<script setup>
import {nextTick, onBeforeUnmount, ref, useId, watch} from "vue";

const model = defineModel({type: Boolean, default: false});
const props = defineProps({
  title: {type: String, default: ""},
  description: {type: String, default: ""},
  size: {type: String, default: "md"},
  modal: {type: Boolean, default: true},
  dismissible: {type: Boolean, default: true},
  showClose: {type: Boolean, default: true},
  stickyFooter: {type: Boolean, default: false},
});

const panel = ref(null);
const titleId = useId();
const descriptionId = useId();
let previousFocus = null;
let previousOverflow = "";

function open() {
  model.value = true;
}

function close() {
  model.value = false;
}

function requestClose() {
  if (props.dismissible) close();
}

function handleAfterLeave() {
  if (props.modal) document.body.style.overflow = previousOverflow;
  previousFocus?.focus?.();
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
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
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
  }
});

onBeforeUnmount(() => {
  if (model.value && props.modal) document.body.style.overflow = previousOverflow;
});
</script>

<template>
  <slot name="trigger" :open="open" :is-open="model" />
  <Teleport to="body">
    <Transition name="ui-dialog" @after-leave="handleAfterLeave">
      <div v-if="model" class="ui-dialog" :class="{'ui-dialog--modal': props.modal}" @keydown="handleKeydown">
        <div v-if="props.modal" class="ui-dialog__overlay" aria-hidden="true" @click="requestClose"></div>
        <section
          ref="panel"
          class="ui-dialog__panel"
          :class="[`ui-dialog__panel--${props.size}`, {'ui-dialog__panel--sticky-footer': props.stickyFooter}]"
          role="dialog"
          :aria-modal="props.modal || undefined"
          :aria-labelledby="props.title || $slots.title ? titleId : undefined"
          :aria-describedby="props.description || $slots.description ? descriptionId : undefined"
          tabindex="-1"
        >
          <header v-if="props.title || props.description || $slots.title || $slots.description" class="ui-dialog__header">
            <h2 v-if="props.title || $slots.title" :id="titleId" class="ui-dialog__title"><slot name="title">{{ props.title }}</slot></h2>
            <p v-if="props.description || $slots.description" :id="descriptionId" class="ui-dialog__description"><slot name="description">{{ props.description }}</slot></p>
          </header>
          <div v-if="$slots.close" class="ui-dialog__custom-close"><slot name="close" :close="close" /></div>
          <button v-else-if="props.showClose" class="ui-dialog__close" type="button" aria-label="Закрыть" @click="close">&times;</button>
          <div class="ui-dialog__content"><slot :close="close" /></div>
          <footer v-if="$slots.footer" class="ui-dialog__footer"><slot name="footer" :close="close" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
