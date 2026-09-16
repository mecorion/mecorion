<script setup>
import {computed, ref} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import UiButton from "./UiButton.vue";

const model = defineModel({default: null});
const props = defineProps({
  label: {type: String, default: "Загрузить файлы"},
  description: {type: String, default: "Перетащите файлы сюда или выберите на устройстве"},
  accept: {type: String, default: ""},
  multiple: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
  maxSize: {type: Number, default: 0},
  maxFiles: {type: Number, default: 0},
  variant: {type: String, default: "dropzone"},
  error: {type: String, default: ""},
  hint: {type: String, default: ""},
  showList: {type: Boolean, default: true},
});
const emit = defineEmits(["change", "reject", "remove"]);

const input = ref(null);
const dragging = ref(false);
const internalError = ref("");
const files = computed(() => props.multiple ? (Array.isArray(model.value) ? model.value : []) : model.value ? [model.value] : []);
const visibleError = computed(() => props.error || internalError.value);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function matchesAccept(file) {
  if (!props.accept) return true;
  return props.accept.split(",").map((value) => value.trim().toLowerCase()).some((rule) => {
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function applyFiles(incoming) {
  if (props.disabled || !incoming.length) return;
  internalError.value = "";
  const rejected = [];
  const valid = incoming.filter((file) => {
    const reason = !matchesAccept(file) ? "type" : props.maxSize > 0 && file.size > props.maxSize ? "size" : "";
    if (reason) rejected.push({file, reason});
    return !reason;
  });
  if (rejected.length) {
    internalError.value = rejected[0].reason === "size"
      ? `Файл «${rejected[0].file.name}» превышает лимит ${formatBytes(props.maxSize)}.`
      : `Формат файла «${rejected[0].file.name}» не поддерживается.`;
    emit("reject", rejected);
  }
  if (!valid.length) return;
  if (!props.multiple) {
    model.value = valid[0];
  } else {
    const current = files.value;
    const known = new Set(current.map(fileKey));
    let next = [...current, ...valid.filter((file) => !known.has(fileKey(file)))];
    if (props.maxFiles > 0 && next.length > props.maxFiles) {
      next = next.slice(0, props.maxFiles);
      internalError.value = `Можно выбрать не более ${props.maxFiles} файлов.`;
      emit("reject", valid.slice(Math.max(0, props.maxFiles - current.length)).map((file) => ({file, reason: "count"})));
    }
    model.value = next;
  }
  emit("change", model.value);
}

function handleInput(event) {
  applyFiles([...event.target.files]);
  event.target.value = "";
}

function openPicker() {
  if (!props.disabled) input.value?.click();
}

function handleDrop(event) {
  dragging.value = false;
  applyFiles([...event.dataTransfer.files]);
}

function removeFile(index) {
  const removed = files.value[index];
  model.value = props.multiple ? files.value.filter((_, fileIndex) => fileIndex !== index) : null;
  internalError.value = "";
  emit("remove", removed);
  emit("change", model.value);
}
</script>

<template>
  <div class="ui-file-picker" :class="[`ui-file-picker--${props.variant}`, {'ui-file-picker--disabled': props.disabled, 'ui-file-picker--invalid': visibleError}]">
    <input ref="input" class="ui-file-picker__input" type="file" :accept="props.accept || undefined" :multiple="props.multiple" :disabled="props.disabled" @change="handleInput" />
    <button
      v-if="props.variant === 'dropzone'"
      class="ui-file-picker__dropzone"
      :class="{'ui-file-picker__dropzone--dragging': dragging}"
      type="button"
      :disabled="props.disabled"
      @click="openPicker"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <span class="ui-file-picker__icon"><SvgIcon name="cloud" /></span>
      <span class="ui-file-picker__copy">
        <strong class="ui-file-picker__label"><slot name="label">{{ props.label }}</slot></strong>
        <span class="ui-file-picker__description"><slot name="description">{{ props.description }}</slot></span>
      </span>
      <span class="ui-file-picker__action">Выбрать</span>
    </button>
    <div v-else class="ui-file-picker__button-row">
      <UiButton type="button" variant="outline" :disabled="props.disabled" @click="openPicker"><SvgIcon name="cloud" />{{ props.label }}</UiButton>
      <span v-if="props.description" class="ui-file-picker__description">{{ props.description }}</span>
    </div>
    <p v-if="visibleError || props.hint" class="ui-file-picker__message" :class="{'ui-file-picker__message--error': visibleError}">{{ visibleError || props.hint }}</p>
    <ul v-if="props.showList && files.length" class="ui-file-picker__list" aria-label="Выбранные файлы">
      <li v-for="(file, index) in files" :key="fileKey(file)" class="ui-file-picker__file">
        <span class="ui-file-picker__file-icon" aria-hidden="true"><SvgIcon name="download" /></span>
        <span class="ui-file-picker__file-copy"><strong>{{ file.name }}</strong><span>{{ formatBytes(file.size) }}</span></span>
        <button class="ui-file-picker__remove" type="button" :disabled="props.disabled" :aria-label="`Удалить ${file.name}`" @click="removeFile(index)">&times;</button>
      </li>
    </ul>
  </div>
</template>
