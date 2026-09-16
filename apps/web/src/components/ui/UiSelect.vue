<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, useId} from "vue";

defineOptions({inheritAttrs: false});

const SCROLLABLE_MENU_HEIGHT = 234;
const model = defineModel({type: [String, Number], default: ""});
const props = defineProps({
  label: {type: String, default: ""},
  options: {type: Array, default: () => []},
  placeholder: {type: String, default: "Выберите значение"},
  invalid: {type: String, default: ""},
  scrollable: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
  id: {type: String, default: ""},
  size: {type: String, default: "default"},
  wrapperClass: {type: [String, Array, Object], default: ""},
});

const root = ref(null);
const trigger = ref(null);
const menu = ref(null);
const scrollArea = ref(null);
const isOpen = ref(false);
const activeIndex = ref(-1);
const placement = ref("bottom");
const menuMaxHeight = ref(null);
const menuPosition = ref({top: 0, left: 0, width: 0});
const canScrollUp = ref(false);
const canScrollDown = ref(false);
let autoScrollFrame = null;
const controlId = props.id || useId();
const listboxId = `${controlId}-listbox`;
const messageId = `${controlId}-message`;
const normalizedOptions = computed(() => props.options.map((option) => (
  typeof option === "object" ? option : {label: String(option), value: option}
)));
const selectedIndex = computed(() => normalizedOptions.value.findIndex((option) => option.value === model.value));
const selectedOption = computed(() => normalizedOptions.value[selectedIndex.value]);
const menuStyle = computed(() => {
  const height = menuMaxHeight.value === null ? undefined : `${menuMaxHeight.value}px`;
  return {
    top: `${menuPosition.value.top}px`,
    right: "auto",
    bottom: "auto",
    left: `${menuPosition.value.left}px`,
    width: `${menuPosition.value.width}px`,
    maxHeight: height,
    height: props.scrollable ? height : undefined,
  };
});

function updateMenuPlacement() {
  if (!isOpen.value || !trigger.value || !menu.value) return;
  const triggerRect = trigger.value.getBoundingClientRect();
  const naturalHeight = props.scrollable ? SCROLLABLE_MENU_HEIGHT : menu.value.scrollHeight;
  const viewportGap = 12;
  const menuGap = 8;
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportGap - menuGap;
  const spaceAbove = triggerRect.top - viewportGap - menuGap;
  placement.value = naturalHeight > spaceBelow && spaceAbove > spaceBelow ? "top" : "bottom";
  const availableSpace = Math.max(0, placement.value === "top" ? spaceAbove : spaceBelow);
  menuMaxHeight.value = Math.floor(Math.min(naturalHeight, availableSpace));
  menuPosition.value = {
    top: placement.value === "top"
      ? triggerRect.top - menuGap - menuMaxHeight.value
      : triggerRect.bottom + menuGap,
    left: triggerRect.left,
    width: triggerRect.width,
  };
}

function updateScrollControls() {
  if (!scrollArea.value) return;
  canScrollUp.value = scrollArea.value.scrollTop > 1;
  canScrollDown.value = scrollArea.value.scrollTop + scrollArea.value.clientHeight < scrollArea.value.scrollHeight - 1;
}

function stopAutoScroll() {
  if (autoScrollFrame !== null) cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = null;
}

function startAutoScroll(direction, event) {
  if (event.pointerType !== "mouse") return;
  stopAutoScroll();
  const tick = () => {
    if (!scrollArea.value) return stopAutoScroll();
    scrollArea.value.scrollTop += direction * 4;
    updateScrollControls();
    if ((direction < 0 && !canScrollUp.value) || (direction > 0 && !canScrollDown.value)) return stopAutoScroll();
    autoScrollFrame = requestAnimationFrame(tick);
  };
  autoScrollFrame = requestAnimationFrame(tick);
}

function scrollStep(direction) {
  scrollArea.value?.scrollBy({top: direction * 96, behavior: "smooth"});
}

async function openSelect() {
  if (props.disabled) return;
  placement.value = "bottom";
  menuMaxHeight.value = null;
  isOpen.value = true;
  activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0;
  await nextTick();
  updateMenuPlacement();
  await nextTick();
  updateScrollControls();
}

function toggleSelect() {
  if (isOpen.value) {
    stopAutoScroll();
    isOpen.value = false;
  }
  else openSelect();
}

function selectOption(option, index) {
  if (option.disabled) return;
  model.value = option.value;
  activeIndex.value = index;
  stopAutoScroll();
  isOpen.value = false;
}

function moveActive(step) {
  if (!isOpen.value) openSelect();
  const enabledIndexes = normalizedOptions.value.reduce((indexes, option, index) => {
    if (!option.disabled) indexes.push(index);
    return indexes;
  }, []);
  if (!enabledIndexes.length) return;
  const currentPosition = enabledIndexes.indexOf(activeIndex.value);
  const nextPosition = (currentPosition + step + enabledIndexes.length) % enabledIndexes.length;
  activeIndex.value = enabledIndexes[nextPosition];
}

function handleKeydown(event) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(event.key === "ArrowDown" ? 1 : -1);
  } else if ((event.key === "Enter" || event.key === " ") && isOpen.value) {
    event.preventDefault();
    const option = normalizedOptions.value[activeIndex.value];
    if (option) selectOption(option, activeIndex.value);
  } else if (event.key === "Escape") {
    stopAutoScroll();
    isOpen.value = false;
  }
}

function handleOutsidePointer(event) {
  if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) {
    stopAutoScroll();
    isOpen.value = false;
  }
}

function handleViewportScroll(event) {
  if (root.value?.contains(event.target) || menu.value?.contains(event.target)) return;
  updateMenuPlacement();
}

onMounted(() => {
  document.addEventListener("pointerdown", handleOutsidePointer);
  window.addEventListener("resize", updateMenuPlacement);
  window.addEventListener("scroll", handleViewportScroll, true);
});
onBeforeUnmount(() => {
  stopAutoScroll();
  document.removeEventListener("pointerdown", handleOutsidePointer);
  window.removeEventListener("resize", updateMenuPlacement);
  window.removeEventListener("scroll", handleViewportScroll, true);
});
</script>

<template>
  <div ref="root" class="mc-field ui-select" :class="[props.wrapperClass, `ui-select--${props.size}`, `ui-select--${placement}`, {'ui-select--open': isOpen, 'ui-select--invalid': props.invalid}]">
    <label v-if="props.label" class="mc-field__label" :for="controlId">{{ props.label }}</label>
    <div class="ui-select__control">
      <button ref="trigger" v-bind="$attrs" :id="controlId" class="mc-field__control ui-select__trigger" type="button" role="combobox" aria-haspopup="listbox" :aria-expanded="isOpen" :aria-controls="listboxId" :aria-activedescendant="isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined" :aria-invalid="Boolean(props.invalid)" :aria-describedby="props.invalid ? messageId : undefined" :disabled="props.disabled" @click="toggleSelect" @keydown="handleKeydown">
        <span :class="{'ui-select__placeholder': !selectedOption}">{{ selectedOption?.label ?? props.placeholder }}</span>
        <span class="ui-select__chevron" aria-hidden="true"></span>
      </button>
      <Teleport to="body">
        <Transition name="ui-select-menu">
          <div v-if="isOpen" ref="menu" class="ui-select__menu" :class="[`ui-select__menu--${placement}`, {'ui-select__menu--scrollable': props.scrollable}]" :style="menuStyle">
          <button v-if="props.scrollable" class="ui-select__scroll-control ui-select__scroll-control--up" type="button" aria-label="Прокрутить список вверх" :disabled="!canScrollUp" @pointerenter="startAutoScroll(-1, $event)" @pointerleave="stopAutoScroll" @click="scrollStep(-1)"><span aria-hidden="true"></span></button>
          <ul :id="listboxId" ref="scrollArea" class="ui-select__options" role="listbox" @scroll="updateScrollControls">
            <li v-for="(option, index) in normalizedOptions" :id="`${listboxId}-option-${index}`" :key="String(option.value)" class="ui-select__option" :class="{'ui-select__option--selected': option.value === model, 'ui-select__option--active': index === activeIndex, 'ui-select__option--disabled': option.disabled}" role="option" :aria-selected="option.value === model" :aria-disabled="option.disabled || undefined" @mouseenter="activeIndex = index" @click="selectOption(option, index)">{{ option.label }}</li>
          </ul>
          <button v-if="props.scrollable" class="ui-select__scroll-control ui-select__scroll-control--down" type="button" aria-label="Прокрутить список вниз" :disabled="!canScrollDown" @pointerenter="startAutoScroll(1, $event)" @pointerleave="stopAutoScroll" @click="scrollStep(1)"><span aria-hidden="true"></span></button>
          </div>
        </Transition>
      </Teleport>
    </div>
    <span v-if="props.invalid" :id="messageId" class="ui-field-message ui-field-message--error">{{ props.invalid }}</span>
  </div>
</template>
