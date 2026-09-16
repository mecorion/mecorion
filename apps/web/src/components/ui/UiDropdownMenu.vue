<script setup>
import {nextTick, onBeforeUnmount, reactive, ref, watch} from "vue";
import UiDropdownMenuNode from "./UiDropdownMenuNode.vue";

const model = defineModel({type: Boolean, default: false});
const props = defineProps({
  items: {type: Array, default: () => []},
  align: {type: String, default: "start"},
  side: {type: String, default: "bottom"},
  offset: {type: Number, default: 8},
  width: {type: String, default: "220px"},
  closeOnSelect: {type: Boolean, default: true},
});
const emit = defineEmits(["select", "change"]);

const anchor = ref(null);
const menu = ref(null);
const position = ref({top: 0, left: 0});
const resolvedSide = ref(props.side);
const itemState = reactive({});

function walk(items, callback, prefix = "item") {
  items.forEach((item, index) => {
    const key = String(item.id || `${prefix}-${index}`);
    callback(item, key);
    if (item.items) walk(item.items, callback, key);
  });
}

watch(() => props.items, (items) => {
  walk(items, (item, key) => {
    if (item.type === "checkbox") itemState[key] = Boolean(item.checked);
    if (item.type === "radio") itemState[key] = Boolean(item.checked);
  });
}, {immediate: true, deep: true});

function open() { model.value = true; }
function close({restoreFocus = false} = {}) {
  model.value = false;
  if (restoreFocus) anchor.value?.querySelector("button, a, [tabindex]")?.focus?.();
}
function toggle() { model.value = !model.value; }

function updatePosition() {
  if (!anchor.value || !menu.value) return;
  const trigger = anchor.value.getBoundingClientRect();
  const panel = menu.value.getBoundingClientRect();
  const padding = 8;
  let side = props.side;
  let top = side === "top" ? trigger.top - panel.height - props.offset : trigger.bottom + props.offset;
  if (side === "bottom" && top + panel.height > window.innerHeight - padding && trigger.top - panel.height - props.offset >= padding) side = "top";
  if (side === "top" && top < padding && trigger.bottom + panel.height + props.offset <= window.innerHeight - padding) side = "bottom";
  top = side === "top" ? trigger.top - panel.height - props.offset : trigger.bottom + props.offset;
  let left = props.align === "start" ? trigger.left : props.align === "center" ? trigger.left + (trigger.width - panel.width) / 2 : trigger.right - panel.width;
  resolvedSide.value = side;
  position.value = {
    top: Math.max(padding, Math.min(top, window.innerHeight - panel.height - padding)),
    left: Math.max(padding, Math.min(left, window.innerWidth - panel.width - padding)),
  };
}

function enabledItems(root = menu.value) {
  return [...(root?.querySelectorAll(":scope > li > [data-dropdown-item]:not([disabled])") || [])];
}

function focusItem(direction, root = document.activeElement?.closest(".ui-dropdown-menu__menu") || menu.value) {
  const items = enabledItems(root);
  if (!items.length) return;
  const current = items.indexOf(document.activeElement);
  const index = direction === "first" ? 0 : direction === "last" ? items.length - 1 : (current + direction + items.length) % items.length;
  items[index].focus();
}

function handleKeydown(event) {
  if (event.key === "Escape") { event.preventDefault(); close({restoreFocus: true}); return; }
  if (event.key === "ArrowDown") { event.preventDefault(); focusItem(1); }
  else if (event.key === "ArrowUp") { event.preventDefault(); focusItem(-1); }
  else if (event.key === "Home") { event.preventDefault(); focusItem("first"); }
  else if (event.key === "End") { event.preventDefault(); focusItem("last"); }
  else if ((event.key === "Enter" || event.key === " ") && document.activeElement?.matches("[data-dropdown-item]")) { event.preventDefault(); document.activeElement.click(); }
  else if (event.key === "ArrowRight" && document.activeElement?.getAttribute("aria-haspopup") === "menu") {
    event.preventDefault();
    enabledItems(document.activeElement.nextElementSibling)[0]?.focus();
  } else if (event.key === "ArrowLeft") {
    const submenu = document.activeElement?.closest(".ui-dropdown-menu__submenu");
    if (submenu) { event.preventDefault(); submenu.previousElementSibling?.focus(); }
  }
}

function handleActivate({item, itemKey}) {
  if (item.type === "checkbox") itemState[itemKey] = !itemState[itemKey];
  if (item.type === "radio") {
    walk(props.items, (candidate, key) => {
      if (candidate.type === "radio" && candidate.group === item.group) itemState[key] = key === itemKey;
    });
  }
  const payload = {item, checked: item.type === "checkbox" || item.type === "radio" ? itemState[itemKey] : undefined};
  emit(item.type === "checkbox" || item.type === "radio" ? "change" : "select", payload);
  item.onSelect?.(payload);
  if (props.closeOnSelect && item.type !== "checkbox" && item.type !== "radio" && !item.keepOpen) close({restoreFocus: true});
}

function handleOutside(event) {
  if (anchor.value?.contains(event.target) || menu.value?.contains(event.target)) return;
  close();
}
function addListeners() {
  document.addEventListener("pointerdown", handleOutside);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
}
function removeListeners() {
  document.removeEventListener("pointerdown", handleOutside);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
}

watch(model, async (value) => {
  removeListeners();
  if (!value) return;
  await nextTick();
  updatePosition();
  addListeners();
  await nextTick();
  focusItem("first", menu.value);
});
onBeforeUnmount(removeListeners);
</script>

<template>
  <span ref="anchor" class="ui-dropdown-menu__anchor"><slot name="trigger" :open="open" :close="close" :toggle="toggle" :is-open="model" /></span>
  <Teleport to="body">
    <Transition name="ui-dropdown-menu">
      <ul
        v-if="model"
        ref="menu"
        class="ui-dropdown-menu__menu ui-dropdown-menu__root"
        :class="[`ui-dropdown-menu--${resolvedSide}`, `ui-dropdown-menu--align-${props.align}`]"
        :style="{top: `${position.top}px`, left: `${position.left}px`, width: props.width}"
        role="menu"
        @keydown="handleKeydown"
      >
        <UiDropdownMenuNode v-for="(item, index) in props.items" :key="item.id || index" :item="item" :item-key="String(item.id || `item-${index}`)" :state="itemState" @activate="handleActivate" />
      </ul>
    </Transition>
  </Teleport>
</template>
