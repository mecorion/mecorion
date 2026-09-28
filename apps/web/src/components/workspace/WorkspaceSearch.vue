<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiInput from "@/components/ui/UiInput.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({config: {type: Object, required: true}});
const root = ref(null);
const focused = ref(false);
const activeIndex = ref(-1);
const query = computed({
  get: () => props.config.query.value,
  set: (value) => { props.config.onInput(value); activeIndex.value = -1; },
});
const suggestions = computed(() => props.config.suggestions.value);
const showSuggestions = computed(() => focused.value && Boolean(query.value.trim()));

function submit() {
  if (activeIndex.value >= 0 && suggestions.value[activeIndex.value]) {
    choose(suggestions.value[activeIndex.value]);
    return;
  }
  props.config.onSubmit(query.value);
  focused.value = false;
  root.value?.querySelector("input")?.blur();
}
function submitAll() {
  activeIndex.value = -1;
  submit();
}
function choose(item) {
  props.config.onSelect(item);
  focused.value = false;
  activeIndex.value = -1;
}
function move(direction) {
  if (!suggestions.value.length) return;
  activeIndex.value = (activeIndex.value + direction + suggestions.value.length) % suggestions.value.length;
}
function activate() { props.config.onActivate(); focused.value = true; }
function onShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    root.value?.querySelector("input")?.focus();
  }
}
onMounted(() => window.addEventListener("keydown", onShortcut));
onBeforeUnmount(() => window.removeEventListener("keydown", onShortcut));
</script>

<template>
  <div ref="root" class="mcrn-search dashboard-search workspace-search">
    <UiInput v-model="query" clearable :placeholder="config.placeholder" :aria-expanded="showSuggestions" aria-controls="music-search-suggestions" autocomplete="off" @clear="config.onClear" @focus="activate" @blur="focused = false" @keydown.enter.prevent="submit" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.escape="focused = false">
      <template #prefix><SvgIcon name="search" /></template>
    </UiInput>
    <kbd v-if="!query">⌘K</kbd>
    <div v-if="showSuggestions" id="music-search-suggestions" class="workspace-search__suggestions">
      <div class="workspace-search__suggestions-head"><span>Быстрый поиск</span><small v-if="suggestions.length">{{ suggestions.length }} {{ suggestions.length === 1 ? 'результат' : suggestions.length < 5 ? 'результата' : 'результатов' }}</small></div>
      <ul v-if="suggestions.length">
        <li v-for="(item, index) in suggestions" :key="`${item.type}-${item.id}`">
          <UiButton unstyled class="workspace-search__suggestion" :class="{active: activeIndex === index, 'workspace-search__suggestion--artist': item.type === 'artist'}" @pointerdown.prevent @click="choose(item)">
            <img v-if="item.cover" :src="item.cover" alt="" />
            <span v-else class="workspace-search__suggestion-icon"><SvgIcon name="music" /></span>
            <span class="workspace-search__suggestion-copy"><strong>{{ item.title }}</strong><small>{{ item.subtitle }}</small></span>
            <span class="workspace-search__suggestion-arrow"><SvgIcon name="chevron-right" /></span>
          </UiButton>
        </li>
      </ul>
      <p v-else class="workspace-search__none">Пока нет совпадений. Попробуйте другой запрос.</p>
      <UiButton unstyled class="workspace-search__all" @pointerdown.prevent @click="submitAll"><SvgIcon name="search" /><span>Все результаты по запросу <strong>«{{ query.trim() }}»</strong></span><SvgIcon name="chevron-right" /></UiButton>
    </div>
  </div>
</template>
