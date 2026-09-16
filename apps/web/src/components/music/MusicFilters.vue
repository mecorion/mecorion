<script setup>
import {computed} from "vue";
import {trackFolder, trackFormat} from "@/music/trackFilters.js";
import UiButton from "@/components/ui/UiButton.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({
  tracks: {type: Array, required: true},
  context: {
    type: String,
    required: true,
    validator: (value) => ["online", "local", "favorites", "playlist"].includes(value),
  },
  modelValue: {type: Object, required: true},
});

const emit = defineEmits(["update:modelValue"]);

const uniqueOptions = (values) => [...new Set(values.filter(Boolean))]
  .sort((left, right) => String(left).localeCompare(String(right), "ru"));

const artists = computed(() => uniqueOptions(props.tracks.map((track) => track.artist)));
const albums = computed(() => uniqueOptions(props.tracks.map((track) => track.album)));
const years = computed(() => uniqueOptions(props.tracks.map((track) => String(track.year ?? ""))).reverse());
const folders = computed(() => uniqueOptions(props.tracks.map(trackFolder)));
const formats = computed(() => uniqueOptions(props.tracks.map(trackFormat)));
const asOptions = (values) => values.map((value) => ({value, label: value}));

const hasActiveFilters = computed(() => Object.entries(props.modelValue)
  .some(([key, value]) => key !== "sort" && Boolean(value)) || props.modelValue.sort !== "title");

const sortOptions = computed(() => {
  const options = [
    {value: "title", label: "По названию"},
    {value: "artist", label: "По исполнителю"},
    {value: "album", label: "По альбому"},
    {value: "duration-short", label: "Сначала короткие"},
    {value: "duration-long", label: "Сначала длинные"},
  ];

  if (props.context === "online") options.push(
    {value: "year-new", label: "Сначала новые"},
    {value: "year-old", label: "Сначала старые"},
  );
  if (props.context === "local") options.push({value: "recent-local", label: "Недавно изменённые"});
  return options;
});

function updateFilter(key, value) {
  emit("update:modelValue", {...props.modelValue, [key]: value});
}

function resetFilters() {
  emit("update:modelValue", {sort: "title"});
}
</script>

<template>
  <section class="memusic-filters" :aria-label="`Фильтры: ${context}`">
    <div class="memusic-filters__heading">
      <span aria-hidden="true"><SvgIcon name="filter" /></span>
      <strong>Фильтры</strong>
      <small>{{ tracks.length }} в разделе</small>
    </div>

    <UiSelect v-if="context === 'favorites'" wrapper-class="memusic-filter-field" label="Источник" :model-value="modelValue.source || ''" :options="[{value: '', label: 'Все источники'}, {value: 'online', label: 'Mecorion'}, {value: 'local', label: 'Локальные'}]" @update:model-value="updateFilter('source', $event)" />
    <UiSelect wrapper-class="memusic-filter-field" label="Исполнитель" :model-value="modelValue.artist || ''" :options="[{value: '', label: 'Все исполнители'}, ...asOptions(artists)]" @update:model-value="updateFilter('artist', $event)" />
    <UiSelect v-if="context !== 'local'" wrapper-class="memusic-filter-field" label="Альбом" :model-value="modelValue.album || ''" :options="[{value: '', label: 'Все альбомы'}, ...asOptions(albums)]" @update:model-value="updateFilter('album', $event)" />
    <UiSelect v-if="context === 'online'" wrapper-class="memusic-filter-field" label="Год" :model-value="modelValue.year || ''" :options="[{value: '', label: 'Любой год'}, ...asOptions(years)]" @update:model-value="updateFilter('year', $event)" />
    <UiSelect v-if="context === 'local'" wrapper-class="memusic-filter-field" label="Папка" :model-value="modelValue.folder || ''" :options="[{value: '', label: 'Все папки'}, ...asOptions(folders)]" @update:model-value="updateFilter('folder', $event)" />
    <UiSelect v-if="context === 'local'" wrapper-class="memusic-filter-field memusic-filter-field--compact" label="Формат" :model-value="modelValue.format || ''" :options="[{value: '', label: 'Все'}, ...asOptions(formats)]" @update:model-value="updateFilter('format', $event)" />
    <UiSelect wrapper-class="memusic-filter-field" label="Длительность" :model-value="modelValue.duration || ''" :options="[{value: '', label: 'Любая'}, {value: 'short', label: 'До 3 минут'}, {value: 'medium', label: '3–5 минут'}, {value: 'long', label: 'Больше 5 минут'}]" @update:model-value="updateFilter('duration', $event)" />
    <UiSelect v-if="context === 'online'" wrapper-class="memusic-filter-field" label="Доступность" :model-value="modelValue.availability || ''" :options="[{value: '', label: 'Все треки'}, {value: 'available', label: 'Можно слушать'}, {value: 'unavailable', label: 'Недоступные'}]" @update:model-value="updateFilter('availability', $event)" />
    <UiSelect wrapper-class="memusic-filter-field" label="Порядок" :model-value="modelValue.sort || 'title'" :options="sortOptions" @update:model-value="updateFilter('sort', $event)" />

    <UiButton
      v-if="hasActiveFilters"
      unstyled
      class="memusic-filters__reset"
      type="button"
      aria-label="Сбросить фильтры"
      title="Сбросить фильтры"
      @click="resetFilters"
    ><SvgIcon name="x" /></UiButton>
  </section>
</template>

