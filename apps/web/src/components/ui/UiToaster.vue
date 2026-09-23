<script setup>
import {ref} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import UiButton from "./UiButton.vue";
import UiSpinner from "./UiSpinner.vue";
import {toast, toastState} from "./toast.js";

const startX = ref(0);
const offsets = ref({});

const iconNames = {success: "badge-check", info: "bell", warning: "shield", error: "x"};

function pointerDown(event, id) {
  startX.value = event.clientX;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  offsets.value[id] = 0;
}

function pointerMove(event, id) {
  if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
  offsets.value[id] = Math.max(0, event.clientX - startX.value);
}

function pointerUp(event, id) {
  if ((offsets.value[id] ?? 0) > 90) toast.close(id);
  delete offsets.value[id];
  event.currentTarget.releasePointerCapture?.(event.pointerId);
}

function runAction(item) {
  item.action?.onClick?.(item.id);
  if (item.action?.close !== false) toast.close(item.id);
}
</script>

<template>
  <Teleport to="body">
    <div class="ui-toaster" aria-label="Уведомления">
      <TransitionGroup name="ui-toast" tag="div" class="ui-toaster__stack">
        <article
          v-for="item in toastState.items"
          :key="item.id"
          class="ui-toast"
          :class="`ui-toast--${item.type}`"
          :style="{'--ui-toast-drag-x': `${offsets[item.id] ?? 0}px`}"
          :role="item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'"
          :aria-live="item.type === 'error' || item.type === 'warning' ? 'assertive' : 'polite'"
          @pointerdown="pointerDown($event, item.id)"
          @pointermove="pointerMove($event, item.id)"
          @pointerup="pointerUp($event, item.id)"
          @pointercancel="pointerUp($event, item.id)"
        >
          <span class="ui-toast__icon" aria-hidden="true">
            <UiSpinner v-if="item.type === 'loading'" size="sm" decorative />
            <SvgIcon v-else :name="iconNames[item.type] || 'bell'" />
          </span>
          <span class="ui-toast__content">
            <strong v-if="item.title">{{ item.title }}</strong>
            <span v-if="item.description">{{ item.description }}</span>
          </span>
          <UiButton v-if="item.action" size="sm" variant="ghost" @click.stop="runAction(item)">{{ item.action.label }}</UiButton>
          <UiButton v-if="item.dismissible" class="ui-toast__close" icon size="sm" variant="ghost" aria-label="Закрыть уведомление" @click.stop="toast.close(item.id)"><SvgIcon name="x" /></UiButton>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
