<script setup>
import {computed} from "vue";
import {UiButton, UiCard, UiEmptyState, UiTabs} from "@/components/ui";
import {videoPath} from "@/video/catalog.js";
import SvgIcon from "@/components/SvgIcon.vue";
import VideoMediaCard from "./VideoMediaCard.vue";

const props = defineProps({query: {type: String, default: ""}, results: {type: Array, default: () => []}});
const emit = defineEmits(["search", "clear"]);
const tab = defineModel("tab", {type: String, default: "all"});
const tabs = [{value: "all", label: "Все"}, {value: "Фильм", label: "Фильмы"}, {value: "Сериал", label: "Сериалы"}, {value: "Дорама", label: "Дорамы"}, {value: "Документальное", label: "Документальное"}, {value: "Мультфильм", label: "Мультфильмы"}, {value: "Подборка", label: "Подборки"}];
const visible = computed(() => tab.value === "all" ? props.results : props.results.filter(item => item.state.kind === tab.value));
const best = computed(() => props.results[0]);
const quick = computed(() => props.results.slice(1, 5));
</script>

<template>
  <section class="memusic-search-view mevideo-search-view" aria-label="Поиск видео">
    <div v-if="!query" class="music-search__welcome">
      <div class="music-search__intro">
        <p class="music-search__eyebrow">Mecorion Video / Поиск</p>
        <h1>Что будем смотреть?</h1>
        <p class="music-search__description">Ищите фильмы, сериалы и другие видео по названию, автору или описанию.</p>
        <p class="music-search__quick-label">Начните с популярной категории</p>
        <div class="music-search__explore-chips">
          <UiButton v-for="item in tabs.slice(1)" :key="item.value" variant="outline" @click="emit('search', item.value)">{{ item.label }}</UiButton>
        </div>
      </div>
      <div class="music-search__explore" aria-hidden="true">
        <div class="music-search__orbit"><SvgIcon name="search" /></div>
        <span class="music-search__visual-caption">Ваша следующая история уже близко</span>
      </div>
    </div>
    <div v-else class="music-search__results">
      <h1>Результаты по запросу «{{ query }}»</h1>
      <UiTabs v-model="tab" :items="tabs" class="music-search__tabs" />
      <p role="status" aria-live="polite">Найдено видео: {{ visible.length }}</p>
      <UiEmptyState v-if="!visible.length" title="Ничего не найдено" description="Попробуйте другое название или категорию.">
        <template #media><SvgIcon name="search" /></template>
        <template #actions><UiButton variant="outline" @click="emit('clear')">Очистить поиск</UiButton></template>
      </UiEmptyState>
      <template v-else>
        <div v-if="tab === 'all'" class="music-search__overview">
          <section class="music-search__best"><h2>Лучший результат</h2><VideoMediaCard :video="best" /></section>
          <section v-if="quick.length" class="music-search__quick">
            <h2>Быстрые результаты</h2>
            <UiCard v-for="video in quick" :key="video.id" raw unstyled class="music-search__quick-card">
              <UiButton unstyled class="music-search__quick-button" :to="videoPath(video.id)">
                <img v-if="video.coverUrl" :src="video.coverUrl" alt="" />
                <SvgIcon v-else name="sidebar-videos" />
                <span><strong>{{ video.title }}</strong><small>{{ video.state.kind }} · {{ video.author }}</small></span><SvgIcon name="chevron-right" />
              </UiButton>
            </UiCard>
          </section>
        </div>
        <section class="music-search__section">
          <h2>{{ tab === 'all' ? 'Все видео' : tabs.find(item => item.value === tab)?.label }}</h2>
          <div class="mevideo-media-grid"><VideoMediaCard v-for="video in visible" :key="video.id" :video="video" /></div>
        </section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.mevideo-search-view .music-search__tabs {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
}
.music-search__quick-button { text-decoration: none; }
</style>
