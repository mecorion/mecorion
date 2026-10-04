<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import {computed, ref} from "vue";
import VideoPlayer from "@/components/video/VideoPlayer.vue";
import VideoShelf from "@/components/video/VideoShelf.vue";
import VideoMediaCard from "@/components/video/VideoMediaCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiProgress, UiSelect} from "@/components/ui";

import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {
  getVideoServicePublications,
} from "@/spaces/spaces.mock.js";

const activeSection = ref("home");
const activeFilter = ref("Все");
const activeQuality = ref("Любое качество");
const activeCategory = ref("Все");
const searchQuery = ref("");
const selectedVideoId = ref(null);
const selectedSeason = ref(1);
const selectedEpisodeId = ref(null);

const navigation = [
  {id: "home", icon: "home", title: "Главная", shortTitle: "Главная"},
  {id: "library", icon: "grid", title: "Медиатека", shortTitle: "Видео"},
];

const filters = [{value: "Все", label: "Все видео"}, {value: "Продолжить", label: "Продолжить просмотр"}, {value: "Позже", label: "Смотреть позже"}];
const hasFilters = computed(() => activeCategory.value !== "Все" || activeFilter.value !== "Все" || activeQuality.value !== "Любое качество");
function resetFilters() {
  activeCategory.value = "Все";
  activeFilter.value = "Все";
  activeQuality.value = "Любое качество";
}
const qualities = ["Любое качество", "2160p", "1440p", "1080p", "720p"];
const categories = ["Все", "Фильмы", "Сериалы", "Дорамы", "Документальное", "Мультфильмы", "Подборки"];

const playbackSettings = ref({});
const recommendedVideos = computed(() => decoratedVideos.value.filter(video => video.id !== selectedVideo.value.id).slice(0, 3));
function toggleSaved() { savedOverrides.value[selectedVideo.value.id] = !isSelectedSaved.value; }
const isSelectedSaved = computed(() => savedOverrides.value[selectedVideo.value.id] ?? selectedVideo.value.state.saved);

const savedOverrides = ref({});
const videoStateById = {
  "director-a-scenes": {progress: 42, watchedMinutes: 18, totalMinutes: 42, saved: true, kind: "Фильм", quality: "2160p", voice: "Оригинал", subtitles: "Русские"},
  "universe-a-order": {progress: 12, watchedMinutes: 4, totalMinutes: 28, saved: false, kind: "Подборка", quality: "1080p", voice: "Дубляж", subtitles: "English"},
};

const fallbackVideos = [
  {
    id: "video-series-01",
    type: "video",
    title: "Сериал: пилотный выпуск",
    subtitle: "Первый эпизод подборки с настройками качества",
    author: "Редакция Mecorion",
    duration: "52 мин",
    coverTone: "cyan",
    spaceId: "series",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские", "Без субтитров"], voice: ["Оригинал", "Дубляж"]},
    seasons: [
      {
        number: 1,
        title: "Сезон 1",
        episodes: [
          {id: "video-series-01-s1-e1", title: "Эпизод 1", duration: "52 мин", progress: 36},
          {id: "video-series-01-s1-e2", title: "Эпизод 2", duration: "48 мин", progress: 0},
          {id: "video-series-01-s1-e3", title: "Эпизод 3", duration: "51 мин", progress: 0},
        ],
      },
      {
        number: 2,
        title: "Сезон 2",
        episodes: [
          {id: "video-series-01-s2-e1", title: "Эпизод 1", duration: "50 мин", progress: 0},
          {id: "video-series-01-s2-e2", title: "Эпизод 2", duration: "47 мин", progress: 0},
        ],
      },
    ],
  },
  {
    id: "video-doc-01",
    type: "video",
    title: "Документальный выпуск",
    subtitle: "Спокойный длинный формат для вечернего просмотра",
    author: "Редакция Mecorion",
    duration: "1 ч 08 мин",
    coverTone: "blue",
    spaceId: "films",
    video: {quality: ["1440p", "1080p", "720p"], subtitles: ["Русские", "English"], voice: ["Оригинал"]},
  },
  {
    id: "video-drama-01",
    type: "video",
    title: "Дорама: тихий город",
    subtitle: "Мягкая история с сезонами, сериями и выбором озвучки",
    author: "Редакция Mecorion",
    duration: "46 мин",
    coverTone: "rose",
    spaceId: "series",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские", "English"], voice: ["Оригинал", "Дубляж"]},
    seasons: [
      {
        number: 1,
        title: "Сезон 1",
        episodes: [
          {id: "video-drama-01-s1-e1", title: "Эпизод 1", duration: "46 мин", progress: 0},
          {id: "video-drama-01-s1-e2", title: "Эпизод 2", duration: "44 мин", progress: 0},
          {id: "video-drama-01-s1-e3", title: "Эпизод 3", duration: "47 мин", progress: 0},
        ],
      },
    ],
  },
  {
    id: "video-animation-01",
    type: "video",
    title: "Анимационный выпуск",
    subtitle: "Короткий семейный формат для вечернего просмотра",
    author: "Редакция Mecorion",
    duration: "24 мин",
    coverTone: "green",
    spaceId: "anime",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские"], voice: ["Дубляж"]},
  },
];

const decoratedVideos = computed(() => [...getVideoServicePublications(), ...fallbackVideos].map((video, index) => ({
  ...video,
  views: video.views ?? [128400, 46700, 23100, 89500, 15200, 6400][index],
  publishedLabel: video.publishedLabel ?? ["4 дня назад", "неделю назад", "2 дня назад", "3 недели назад", "5 дней назад", "вчера"][index],
  state: videoStateById[video.id] ?? {
    progress: index % 2 ? 0 : 7,
    watchedMinutes: index % 2 ? 0 : 5,
    totalMinutes: Number.parseInt(video.duration, 10) || 45,
    saved: index % 2 === 0,
    kind: video.id.includes("drama") ? "Дорама" : video.id.includes("animation") ? "Мультфильм" : video.id.includes("doc") ? "Документальное" : video.seasons?.length ? "Сериал" : "Фильм",
    quality: video.video?.quality?.[0] ?? "1080p",
    voice: video.video?.voice?.[0] ?? "Оригинал",
    subtitles: video.video?.subtitles?.[0] ?? "Русские",
  },
})));

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

function navigate(section) {
  activeSection.value = section;
  if (section === "watchLater") {
    activeFilter.value = "Позже";
  }
}

useContextNavigation({
  title: "Mecorion",
  subtitle: "Video",
  accent: "#8f86ff",
  accentStrong: "#aaa4ff",
  accentContrast: "#ffffff",
  activeId: activeSection,
  groups: computed(() => [
    {label: null, navLabel: "Разделы Video", items: navigation.map((item) => ({...item, action: () => navigate(item.id)}))},
  ]),
});

function openWatch(videoId) {
  selectedVideoId.value = videoId;
  selectedSeason.value = 1;
  selectedEpisodeId.value = null;
  activeSection.value = "watch";
}

function openRow(row) {
  activeSection.value = "library";
  activeFilter.value = "Все";
  activeQuality.value = "Любое качество";

  if (row.id === "continue") {
    activeFilter.value = "Продолжить";
    activeCategory.value = "Все";
    return;
  }

  if (row.id === "quality") {
    activeQuality.value = "2160p";
    activeCategory.value = "Все";
    return;
  }

  const categoryByRow = {
    films: "Фильмы",
    series: "Сериалы",
    drama: "Дорамы",
    docs: "Документальное",
    animation: "Мультфильмы",
  };

  activeCategory.value = categoryByRow[row.id] ?? "Все";
}

function chooseSeason(seasonNumber) {
  selectedSeason.value = seasonNumber;
  selectedEpisodeId.value = null;
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
                <UiButton variant="primary" @click="openWatch(heroVideo.id)"><SvgIcon name="play" />Продолжить просмотр</UiButton>
                <UiButton variant="outline" :to="`/space/${heroVideo.spaceId}/publication/${heroVideo.id}`">Подробнее<SvgIcon name="arrow-up-right-1" /></UiButton>
              </div>
            </div>
            <div class="mevideo-cinema-hero__visual">
              <UiButton unstyled class="mevideo-cinema-hero__frame" :aria-label="`Смотреть ${heroVideo.title}`" @click="openWatch(heroVideo.id)">
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
              @click="activeCategory = category; activeSection = category === 'Все' ? 'home' : 'library'"
            >
              {{ category }}
            </UiButton>
          </section>

          <VideoShelf v-for="row in videoRows" :key="row.id" :row="row" @watch="openWatch" @browse="openRow" />
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
            <VideoMediaCard v-for="video in videos" :key="video.id" :video="video" @watch="openWatch" />
            <UiEmptyState v-if="!videos.length" title="Видео не найдены" description="Попробуйте изменить фильтры." />
          </section>
        </template>

        <template v-else>
          <section class="mevideo-watch-view">
            <div class="mevideo-watch-view__main">
              <VideoPlayer :key="`${selectedVideo.id}-${currentEpisode?.id ?? ''}`" :video="selectedVideo" :settings="playbackSettings[selectedVideo.id] ?? {}" @setting="updatePlaybackSetting($event.key, $event.value)" />
              <div class="mevideo-watch-view__meta">
                <div class="mevideo-watch-view__eyebrow"><UiBadge variant="accent">{{ selectedVideo.state.kind }}</UiBadge><span>{{ selectedVideo.duration }}</span><span>{{ selectedVideo.publishedLabel }}</span></div>
                <h1>{{ selectedVideo.title }}</h1>
                <p v-if="currentEpisode" class="mevideo-watch-view__episode">{{ currentSeason.title }} · {{ currentEpisode.title }}</p>
                <div class="mevideo-watch-view__identity">
                  <div class="mevideo-watch-view__author"><UiAvatar :src="selectedVideo.authorAvatar" :alt="selectedVideo.author" fallback="М" size="sm" /><div><strong>{{ selectedVideo.author }}</strong><span>{{ new Intl.NumberFormat('ru-RU').format(selectedVideo.views) }} просмотров</span></div></div>
                  <div class="mevideo-watch-view__actions">
                    <UiButton variant="outline" :aria-pressed="isSelectedSaved" @click="toggleSaved"><SvgIcon name="star" />{{ isSelectedSaved ? 'Сохранено' : 'Смотреть позже' }}</UiButton>
                    <UiButton variant="ghost" :to="`/space/${selectedVideo.spaceId}/publication/${selectedVideo.id}`">О публикации<SvgIcon name="arrow-up-right-1" /></UiButton>
                  </div>
                </div>
                <UiCard class="mevideo-watch-view__description" raw size="sm"><p>{{ selectedVideo.subtitle }}</p><p>{{ selectedVideo.body || 'Выберите серию и продолжите историю в удобном для вас темпе.' }}</p></UiCard>
              </div>
            </div>
            <aside class="mevideo-watch-view__aside" :aria-label="selectedVideo.seasons?.length ? 'Сезоны и серии' : 'Другие видео'">
              <h2>{{ selectedVideo.seasons?.length ? 'Сезоны и серии' : 'Смотрите также' }}</h2>
              <template v-if="selectedVideo.seasons?.length">
                <div class="mevideo-season-tabs" aria-label="Сезоны">
                  <UiButton unstyled
                    v-for="season in selectedVideo.seasons"
                    :key="season.number"
                    :class="{'is-active': currentSeason?.number === season.number}" :aria-pressed="currentSeason?.number === season.number"
                    type="button"
                    @click="chooseSeason(season.number)"
                  >
                    {{ season.title }}
                  </UiButton>
                </div>

                <div class="mevideo-episode-list">
                  <UiButton unstyled
                    v-for="episode in currentSeason?.episodes"
                    :key="episode.id"
                    :class="{'is-active': currentEpisode?.id === episode.id}" :aria-pressed="currentEpisode?.id === episode.id"
                    type="button"
                    @click="selectedEpisodeId = episode.id"
                  >
                    <span>{{ episode.title }}</span>
                    <small>{{ episode.duration }}</small>
                    <UiProgress class="mevideo-episode-progress" :value="episode.progress" size="sm" aria-label="Прогресс эпизода" />
                  </UiButton>
                </div>
              </template>

              <div v-if="!selectedVideo.seasons?.length" class="mevideo-watch-view__recommendations">
                <VideoMediaCard v-for="video in recommendedVideos" :key="video.id" :video="video" @watch="openWatch" />
              </div>
            </aside>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
