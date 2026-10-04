<script setup>
import {computed} from "vue";
import {useRoute, useRouter, useState} from "#app";
import {videoCatalog, videoPath} from "@/video/catalog.js";
import VideoPlayer from "@/components/video/VideoPlayer.vue";
import VideoShelf from "@/components/video/VideoShelf.vue";
import VideoMediaCard from "@/components/video/VideoMediaCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiProgress, UiSelect, toast} from "@/components/ui";

import {useContextNavigation} from "@/navigation/contextNavigation.js";
const route = useRoute();
const router = useRouter();
const activeSection = computed(() => {
  const path = route.path.replace(/\/$/, "");
  return path === "/video" ? "home" : path === "/video/library" ? "library" : "watch";
});
function queryFilter(key, fallback, values) {
  return computed({
    get: () => values.includes(route.query[key]) ? route.query[key] : fallback,
    set: value => router.push({path: route.path, query: {...route.query, [key]: value === fallback ? undefined : value}}),
  });
}
const activeFilter = queryFilter("filter", "Все", ["Все", "Продолжить", "Позже"]);
const activeQuality = queryFilter("quality", "Любое качество", ["Любое качество", "2160p", "1440p", "1080p", "720p"]);
const activeCategory = queryFilter("category", "Все", ["Все", "Фильмы", "Сериалы", "Дорамы", "Документальное", "Мультфильмы", "Подборки"]);
const searchQuery = computed(() => typeof route.query.q === "string" ? route.query.q : "");
const selectedVideoId = computed(() => route.params.id);
const selectedSeason = computed(() => Number(route.query.season ?? 1));
const selectedEpisodeId = computed(() => route.query.episode);

const navigation = [
  {id: "home", route: "/video", icon: "home", title: "Главная", shortTitle: "Главная"},
  {id: "library", route: "/video/library", icon: "grid", title: "Медиатека", shortTitle: "Видео"},
];

const filters = [{value: "Все", label: "Все видео"}, {value: "Продолжить", label: "Продолжить просмотр"}, {value: "Позже", label: "Смотреть позже"}];
const hasFilters = computed(() => activeCategory.value !== "Все" || activeFilter.value !== "Все" || activeQuality.value !== "Любое качество");
function resetFilters() { return router.push({path: route.path, query: searchQuery.value ? {q: searchQuery.value} : {}}); }

const qualities = ["Любое качество", "2160p", "1440p", "1080p", "720p"];
const categories = ["Все", "Фильмы", "Сериалы", "Дорамы", "Документальное", "Мультфильмы", "Подборки"];

const playbackSettings = useState("video-playback-settings", () => ({}));
const recommendedVideos = computed(() => decoratedVideos.value.filter(video => video.id !== selectedVideo.value.id && video.state.kind === selectedVideo.value.state.kind).slice(0, 3));
function toggleSaved() {
  const saved = !isSelectedSaved.value;
  savedOverrides.value[selectedVideo.value.id] = saved;
  if (saved) toast.add({type: "success", title: "Видео сохранено в «Смотреть позже»"});
}
const isSelectedSaved = computed(() => savedOverrides.value[selectedVideo.value.id] ?? selectedVideo.value.state.saved);

const savedOverrides = useState("video-saved-overrides", () => ({}));
const decoratedVideos = computed(() => videoCatalog);

const heroVideo = computed(() => continueVideo.value);
const seriesVideos = computed(() => decoratedVideos.value.filter((video) => video.seasons?.length || video.state.kind === "Сериал"));
const movieVideos = computed(() => decoratedVideos.value.filter((video) => video.state.kind === "Фильм"));
const highQualityVideos = computed(() => decoratedVideos.value.filter((video) => video.video?.quality?.some((quality) => ["2160p", "1440p"].includes(quality))));
const videoRows = computed(() => [
  {id: "continue", title: "Продолжить просмотр", action: "Смотреть всё", items: decoratedVideos.value.filter((item) => item.state.progress > 0)},
  {id: "films", title: "Фильмы", action: "Все фильмы", items: movieVideos.value},
  {id: "series", title: "Сериалы", action: "Все сериалы", items: seriesVideos.value},
  {id: "drama", title: "Дорамы", action: "Все дорамы", items: decoratedVideos.value.filter((item) => item.state.kind === "Дорама")},
  {id: "docs", title: "Документальное", action: "Все выпуски", items: decoratedVideos.value.filter((item) => item.state.kind === "Документальное")},
  {id: "animation", title: "Мультфильмы", action: "Все мультфильмы", items: decoratedVideos.value.filter((item) => item.state.kind === "Мультфильм")},
  {id: "quality", title: "В высоком качестве", action: "4K / 2K", items: highQualityVideos.value},
].filter((row) => row.items.length));

const videos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  let items = decoratedVideos.value;

  if (activeFilter.value === "Продолжить") {
    items = items.filter((item) => item.state.progress > 0);
  }

  if (activeFilter.value === "Позже") {
    items = items.filter((item) => savedOverrides.value[item.id] ?? item.state.saved);
  }

  if (activeCategory.value !== "Все") {
    const kind = {Фильмы: "Фильм", Сериалы: "Сериал", Дорамы: "Дорама", Мультфильмы: "Мультфильм", Подборки: "Подборка"}[activeCategory.value] ?? activeCategory.value;
    items = items.filter((item) => item.state.kind === kind);
  }

  if (activeQuality.value !== "Любое качество") {
    items = items.filter((item) => item.video?.quality?.includes(activeQuality.value));
  }

  if (query) {
    items = items.filter((item) => `${item.title} ${item.subtitle} ${item.author}`.toLowerCase().includes(query));
  }

  return items;
});

const continueVideo = computed(() => decoratedVideos.value.find((video) => video.state.progress > 0) ?? decoratedVideos.value[0]);
function updatePlaybackSetting(key, value) {
  playbackSettings.value[selectedVideo.value.id] = {...playbackSettings.value[selectedVideo.value.id], [key]: value};
}

const selectedVideo = computed(() => decoratedVideos.value.find((video) => video.id === selectedVideoId.value) ?? continueVideo.value);
const currentSeason = computed(() => {
  const seasons = selectedVideo.value?.seasons ?? [];
  return seasons.find((season) => season.number === selectedSeason.value) ?? seasons[0] ?? null;
});
const currentEpisode = computed(() => {
  const episodes = currentSeason.value?.episodes ?? [];
  return episodes.find((episode) => episode.id === selectedEpisodeId.value) ?? episodes[0] ?? null;
});
const seasonOptions = computed(() => (selectedVideo.value.seasons ?? []).map(season => ({value: season.number, label: season.title})));
const episodeOptions = computed(() => (currentSeason.value?.episodes ?? []).map(episode => ({value: episode.id, label: `${episode.title} · ${episode.duration}`})));
function selectSeason(number) {
  const season = selectedVideo.value.seasons?.find(item => item.number === number);
  if (season?.episodes.length) return router.push(episodePath(season, season.episodes[0]));
}
function selectEpisode(id) {
  const episode = currentSeason.value?.episodes.find(item => item.id === id);
  if (episode) return router.push(episodePath(currentSeason.value, episode));
}


useContextNavigation({
  title: "Mecorion",
  subtitle: "Video",
  accent: "#8f86ff",
  accentStrong: "#aaa4ff",
  accentContrast: "#ffffff",
  activeId: activeSection,
  groups: computed(() => [
    {label: null, navLabel: "Разделы Video", items: navigation},
  ]),
});

function openRow(row) {
  const categoryByRow = {films: "Фильмы", series: "Сериалы", drama: "Дорамы", docs: "Документальное", animation: "Мультфильмы"};
  return router.push({path: "/video/library", query: row.id === "continue" ? {filter: "Продолжить"} : row.id === "quality" ? {quality: "2160p"} : categoryByRow[row.id] ? {category: categoryByRow[row.id]} : {}});
}
function episodePath(season, episode) {
  return {path: videoPath(selectedVideo.value.id), query: {season: String(season.number), episode: episode.id}};
}

</script>

<template>
  <div class="mevideo-app">

    <section class="mevideo-workspace">

      <main class="mevideo-content">
        <template v-if="activeSection === 'home'">
          <section class="mevideo-cinema-hero" aria-labelledby="video-feature-title">
            <div class="mevideo-cinema-hero__copy">
              <div class="mevideo-cinema-hero__eyebrow"><SvgIcon name="sidebar-videos" /><span>Mecorion Video</span><UiBadge variant="accent">В центре внимания</UiBadge></div>
              <h1 id="video-feature-title">{{ heroVideo.title }}</h1>
              <p class="mevideo-cinema-hero__description">{{ heroVideo.subtitle }}. Продолжите с того места, где остановились.</p>
              <div class="mevideo-cinema-hero__meta" aria-label="Информация о видео">
                <UiBadge>{{ heroVideo.state.kind }}</UiBadge>
                <span>{{ heroVideo.state.quality }}</span>
                <span>{{ heroVideo.duration }}</span>
                <span>{{ heroVideo.state.subtitles }} субтитры</span>
              </div>
              <div class="mevideo-cinema-hero__actions">
                <UiButton variant="primary" :to="videoPath(heroVideo.id)"><SvgIcon name="play" />Продолжить просмотр</UiButton>
                <UiButton variant="outline" :to="`/space/${heroVideo.spaceId}/publication/${heroVideo.id}`">Подробнее<SvgIcon name="arrow-up-right-1" /></UiButton>
              </div>
            </div>
            <div class="mevideo-cinema-hero__visual">
              <UiButton unstyled class="mevideo-cinema-hero__frame" :aria-label="`Смотреть ${heroVideo.title}`" :to="videoPath(heroVideo.id)">
                <span class="mevideo-cinema-hero__frame-label">MECORION VIDEO</span>
                <span class="mevideo-cinema-hero__frame-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
                <span class="mevideo-cinema-hero__frame-play"><SvgIcon name="play" /></span>
                <span class="mevideo-cinema-hero__frame-quality">{{ heroVideo.state.quality }}</span>
              </UiButton>
              <UiCard class="mevideo-cinema-hero__continue" raw size="sm" aria-label="Ваш прогресс просмотра">
                <div class="mevideo-cinema-hero__continue-heading"><span>Продолжить историю</span><strong>{{ heroVideo.state.watchedMinutes }} <small>/ {{ heroVideo.state.totalMinutes }} мин</small></strong></div>
                <UiProgress :value="heroVideo.state.progress" size="sm" />
              </UiCard>
            </div>
          </section>

          <section class="mevideo-channel-strip" aria-label="Быстрые фильтры">
            <UiButton unstyled
              v-for="category in categories"
              :key="category"
              :class="{'is-active': activeCategory === category}" :aria-pressed="activeCategory === category"
              type="button"
              @click="activeCategory = category"
            >
              {{ category }}
            </UiButton>
          </section>

          <template v-if="hasFilters || searchQuery">
            <div class="mevideo-library-toolbar__summary">
              <span role="status" aria-live="polite">Найдено видео: <strong>{{ videos.length }}</strong></span>
              <UiButton variant="ghost" size="sm" :disabled="!hasFilters" @click="resetFilters">Сбросить фильтры</UiButton>
            </div>
            <section class="mevideo-media-grid" aria-label="Результаты фильтрации Video">
              <VideoMediaCard v-for="video in videos" :key="video.id" :video="video" />
              <UiEmptyState v-if="!videos.length" title="Видео не найдены" description="Попробуйте изменить фильтры." />
            </section>
          </template>
          <template v-else>
            <VideoShelf v-for="row in videoRows" :key="row.id" :row="row" @browse="openRow" />
          </template>
        </template>

        <template v-else-if="activeSection === 'search' || activeSection === 'library' || activeSection === 'watchLater'">
          <section class="mevideo-page-heading mevideo-library-heading">
            <p class="mevideo-kicker">{{ activeSection === 'search' ? 'Поиск' : activeSection === 'watchLater' ? 'Смотреть позже' : 'Медиатека' }}</p>
            <h1>{{ searchQuery ? `Результаты для «${searchQuery}»` : activeSection === 'watchLater' ? 'Смотреть позже' : 'Медиатека' }}</h1>
            <p>Фильмы, сериалы и истории для вашего следующего вечера.</p>
          </section>

          <section class="mevideo-library-toolbar" aria-label="Фильтры медиатеки">
            <div class="mevideo-library-toolbar__filters">
              <UiSelect v-model="activeCategory" label="Категория" :options="categories" />
              <UiSelect v-model="activeFilter" label="Просмотр" :options="filters" />
              <UiSelect v-model="activeQuality" label="Качество" :options="qualities" />
            </div>
            <div class="mevideo-library-toolbar__summary">
              <span role="status" aria-live="polite">Найдено видео: <strong>{{ videos.length }}</strong></span>
              <UiButton variant="ghost" size="sm" :disabled="!hasFilters" @click="resetFilters">Сбросить фильтры</UiButton>
            </div>
          </section>

          <section class="mevideo-media-grid" aria-label="Каталог Video">
            <VideoMediaCard v-for="video in videos" :key="video.id" :video="video" />
            <UiEmptyState v-if="!videos.length" title="Видео не найдены" description="Попробуйте изменить фильтры." />
          </section>
        </template>

        <template v-else>
          <section class="mevideo-watch-view">
            <div class="mevideo-watch-view__main">
              <VideoPlayer :key="`${selectedVideo.id}-${currentEpisode?.id ?? ''}`" :video="selectedVideo" :settings="playbackSettings[selectedVideo.id] ?? {}" @setting="updatePlaybackSetting($event.key, $event.value)">
                <template v-if="selectedVideo.seasons?.length" #selectors>
                  <UiSelect wrapper-class="mevideo-player__season" size="sm" aria-label="Сезон" :model-value="currentSeason?.number" :options="seasonOptions" :scrollable="seasonOptions.length > 4" @update:model-value="selectSeason" />
                  <UiSelect wrapper-class="mevideo-player__episode" size="sm" aria-label="Серия" :model-value="currentEpisode?.id" :options="episodeOptions" :scrollable="episodeOptions.length > 4" @update:model-value="selectEpisode" />
                </template>
              </VideoPlayer>
              <div class="mevideo-watch-view__meta">
                <div class="mevideo-watch-view__eyebrow"><UiBadge variant="accent">{{ selectedVideo.state.kind }}</UiBadge><span>{{ selectedVideo.duration }}</span><span>{{ selectedVideo.publishedLabel }}</span></div>
                <h1>{{ selectedVideo.title }}</h1>
                <p v-if="currentEpisode" class="mevideo-watch-view__episode">{{ currentSeason.title }} · {{ currentEpisode.title }}</p>
                <div class="mevideo-watch-view__identity">
                  <div class="mevideo-watch-view__author"><UiAvatar :src="selectedVideo.authorAvatar" :alt="selectedVideo.author" fallback="М" size="sm" /><div><strong>{{ selectedVideo.author }}</strong><span>{{ new Intl.NumberFormat('ru-RU').format(selectedVideo.views) }} просмотров</span></div></div>
                  <div class="mevideo-watch-view__actions">
                    <UiButton :variant="isSelectedSaved ? 'primary' : 'outline'" :aria-pressed="isSelectedSaved" @click="toggleSaved"><SvgIcon name="star" />Смотреть позже</UiButton>
                    <UiButton variant="ghost" :to="`/space/${selectedVideo.spaceId}/publication/${selectedVideo.id}`">О публикации<SvgIcon name="arrow-up-right-1" /></UiButton>
                  </div>
                </div>
                <UiCard class="mevideo-watch-view__description" raw size="sm"><p>{{ selectedVideo.subtitle }}</p><p>{{ selectedVideo.body || 'Выберите серию и продолжите историю в удобном для вас темпе.' }}</p></UiCard>
              </div>
            </div>
            <aside class="mevideo-watch-view__aside" aria-label="Предложенные медиа">
              <h2>Смотрите также</h2>

              <div class="mevideo-watch-view__recommendations">
                <VideoMediaCard v-for="video in recommendedVideos" :key="video.id" :video="video" />
                <UiEmptyState v-if="!recommendedVideos.length" title="Пока нет рекомендаций" description="Другие медиа этого типа скоро появятся." />
              </div>
            </aside>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
