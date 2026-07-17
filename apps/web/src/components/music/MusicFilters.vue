<script setup>
import {computed} from "vue";
import {trackFolder, trackFormat} from "@/music/trackFilters.js";

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
      <span aria-hidden="true">⌁</span>
      <strong>Фильтры</strong>
      <small>{{ tracks.length }} в разделе</small>
    </div>

    <label v-if="context === 'favorites'" class="memusic-filter-field">
      <span>Источник</span>
      <select :value="modelValue.source || ''" @change="updateFilter('source', $event.target.value)">
        <option value="">Все источники</option>
        <option value="online">Mecorion</option>
        <option value="local">Локальные</option>
      </select>
    </label>

    <label class="memusic-filter-field">
      <span>Исполнитель</span>
      <select :value="modelValue.artist || ''" @change="updateFilter('artist', $event.target.value)">
        <option value="">Все исполнители</option>
        <option v-for="artist in artists" :key="artist" :value="artist">{{ artist }}</option>
      </select>
    </label>

    <label v-if="context !== 'local'" class="memusic-filter-field">
      <span>Альбом</span>
      <select :value="modelValue.album || ''" @change="updateFilter('album', $event.target.value)">
        <option value="">Все альбомы</option>
        <option v-for="album in albums" :key="album" :value="album">{{ album }}</option>
      </select>
    </label>

    <label v-if="context === 'online'" class="memusic-filter-field">
      <span>Год</span>
      <select :value="modelValue.year || ''" @change="updateFilter('year', $event.target.value)">
        <option value="">Любой год</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
    </label>

    <label v-if="context === 'local'" class="memusic-filter-field">
      <span>Папка</span>
      <select :value="modelValue.folder || ''" @change="updateFilter('folder', $event.target.value)">
        <option value="">Все папки</option>
        <option v-for="folder in folders" :key="folder" :value="folder">{{ folder }}</option>
      </select>
    </label>

    <label v-if="context === 'local'" class="memusic-filter-field memusic-filter-field--compact">
      <span>Формат</span>
      <select :value="modelValue.format || ''" @change="updateFilter('format', $event.target.value)">
        <option value="">Все</option>
        <option v-for="format in formats" :key="format" :value="format">{{ format }}</option>
      </select>
    </label>

    <label class="memusic-filter-field">
      <span>Длительность</span>
      <select :value="modelValue.duration || ''" @change="updateFilter('duration', $event.target.value)">
        <option value="">Любая</option>
        <option value="short">До 3 минут</option>
        <option value="medium">3–5 минут</option>
        <option value="long">Больше 5 минут</option>
      </select>
    </label>

    <label v-if="context === 'online'" class="memusic-filter-field">
      <span>Доступность</span>
      <select :value="modelValue.availability || ''" @change="updateFilter('availability', $event.target.value)">
        <option value="">Все треки</option>
        <option value="available">Можно слушать</option>
        <option value="unavailable">Недоступные</option>
      </select>
    </label>

    <label class="memusic-filter-field">
      <span>Порядок</span>
      <select :value="modelValue.sort || 'title'" @change="updateFilter('sort', $event.target.value)">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>

    <button
      v-if="hasActiveFilters"
      class="memusic-filters__reset"
      type="button"
      aria-label="Сбросить фильтры"
      title="Сбросить фильтры"
      @click="resetFilters"
    >×</button>
  </section>
</template>

