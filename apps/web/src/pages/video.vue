<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import {computed, ref} from "vue";
import VideoMediaCard from "@/components/video/VideoMediaCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiButton, UiEmptyState, UiProgress, UiSelect} from "@/components/ui";

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
  {id: "watchLater", icon: "star", title: "Смотреть позже", shortTitle: "Позже"},
  {id: "watch", icon: "play", title: "Плеер", shortTitle: "Плеер"},
];

const filters = ["Все", "Фильмы", "Сериалы", "Подборки", "Продолжить", "Позже"];
const qualities = ["Любое качество", "2160p", "1440p", "1080p", "720p"];
const categories = ["Все", "Фильмы", "Сериалы", "Дорамы", "Документальное", "Мультфильмы", "Подборки"];

const playbackSettings = ref({});

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

  if (activeFilter.value === "Фильмы") {
    items = items.filter((item) => item.state.kind === "Фильм");
  }

  if (activeFilter.value === "Сериалы") {
    items = items.filter((item) => item.state.kind === "Сериал");
  }

  if (activeFilter.value === "Подборки") {
    items = items.filter((item) => item.state.kind === "Подборка");
  }

  if (activeFilter.value === "Продолжить") {
    items = items.filter((item) => item.state.progress > 0);
  }

  if (activeFilter.value === "Позже") {
    items = items.filter((item) => item.state.saved);
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
const savedVideos = computed(() => decoratedVideos.value.filter((video) => video.state.saved));
const collections = computed(() => [
  {title: "Продолжить", count: decoratedVideos.value.filter((video) => video.state.progress > 0).length, icon: "arrow-up-right-1"},
  {title: "Смотреть позже", count: savedVideos.value.length, icon: "star"},
  {title: "4K / 2K", count: decoratedVideos.value.filter((video) => video.video?.quality?.some((quality) => ["2160p", "1440p"].includes(quality))).length, icon: "play"},
  {title: "С субтитрами", count: decoratedVideos.value.filter((video) => video.video?.subtitles?.length).length, icon: "list-music"},
]);

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
    {label: "Категории", items: categories.map((category) => ({
      title: category,
      icon: category === "Все" ? "grid" : "play",
      active: activeSection.value === "library" && activeCategory.value === category,
      action: () => { activeCategory.value = category; navigate("library"); },
    }))},
    {label: "Коллекции", items: collections.value.map((collection) => ({
      title: `${collection.title} · ${collection.count}`,
      icon: collection.icon,
      action: () => navigate("library"),
    }))},
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
          <section class="mevideo-cinema-hero" :class="`space-publication-card--${heroVideo.coverTone}`">
            <div class="mevideo-cinema-hero__copy">
              <p class="mevideo-kicker">Mecorion Video</p>
              <h1>{{ heroVideo.title }}</h1>
              <p>{{ heroVideo.subtitle }}. Выбирайте качество, субтитры, озвучку и продолжайте просмотр с любого места.</p>
              <div class="mevideo-cinema-hero__meta">
                <span>{{ heroVideo.state.kind }}</span>
                <span>{{ heroVideo.state.quality }}</span>
                <span>{{ heroVideo.duration }}</span>
              </div>
              <div class="mevideo-cinema-hero__actions">
                <UiButton unstyled type="button" @click="openWatch(heroVideo.id)"><SvgIcon name="play" /> Смотреть</UiButton>
                <UiButton unstyled type="button" @click="activeSection = 'library'">Подробнее</UiButton>
              </div>
            </div>

            <aside class="mevideo-cinema-hero__continue">
              <span>Продолжить</span>
              <strong>{{ heroVideo.state.watchedMinutes }} / {{ heroVideo.state.totalMinutes }} мин</strong>
              <UiProgress :value="heroVideo.state.progress" size="sm" aria-label="Прогресс просмотра" />
            </aside>
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

          <section v-for="row in videoRows" :key="row.id" class="mevideo-row">
            <div class="mevideo-section-heading">
              <h2>{{ row.title }}</h2>
              <UiButton unstyled
                type="button"
                @click="openRow(row)"
              >
                {{ row.action }}
              </UiButton>
            </div>

            <div class="mevideo-media-grid">
              <VideoMediaCard v-for="video in row.items" :key="video.id" :video="video" @watch="openWatch" />
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'search' || activeSection === 'library' || activeSection === 'watchLater'">
          <section class="mevideo-page-heading">
            <p class="mevideo-kicker">{{ activeSection === 'search' ? 'Поиск' : activeSection === 'watchLater' ? 'Смотреть позже' : 'Медиатека' }}</p>
            <h1>{{ searchQuery ? `Результаты для «${searchQuery}»` : 'Просмотр всех фильмов и видео' }}</h1>
            <p>Фильтруйте каталог по типу, качеству, прогрессу просмотра и сохранённым материалам.</p>
          </section>

          <section class="mevideo-filter-panel" aria-label="Фильтры Video">
            <div class="mevideo-filter-row">
              <UiButton unstyled v-for="category in categories" :key="category" :class="{'is-active': activeCategory === category}" :aria-pressed="activeCategory === category" type="button" @click="activeCategory = category">
                {{ category }}
              </UiButton>
            </div>
            <div class="mevideo-filter-row">
              <UiButton unstyled v-for="filter in filters" :key="filter" :class="{'is-active': activeFilter === filter}" :aria-pressed="activeFilter === filter" type="button" @click="activeFilter = filter">
                {{ filter }}
              </UiButton>
            </div>
            <div class="mevideo-filter-row">
              <UiButton unstyled v-for="quality in qualities" :key="quality" :class="{'is-active': activeQuality === quality}" :aria-pressed="activeQuality === quality" type="button" @click="activeQuality = quality">
                {{ quality }}
              </UiButton>
            </div>
          </section>

          <section class="mevideo-media-grid" aria-label="Каталог Video">
            <VideoMediaCard v-for="video in videos" :key="video.id" :video="video" @watch="openWatch" />
            <UiEmptyState v-if="!videos.length" title="Видео не найдены" description="Попробуйте изменить фильтры." />
          </section>
        </template>

        <template v-else>
          <section class="mevideo-watch">
            <main class="mevideo-watch__player">
              <div class="mevideo-screen" :class="`space-publication-card--${selectedVideo.coverTone}`">
                <UiButton unstyled type="button" aria-label="Воспроизвести">
                  <SvgIcon name="play" /></UiButton>
                <span>{{ playbackSettings[selectedVideo.id]?.quality ?? selectedVideo.state.quality }}</span>
              </div>
              <div class="mevideo-watch__meta">
                <p class="mevideo-kicker">{{ selectedVideo.state.kind }}</p>
                <h1>{{ selectedVideo.title }}</h1>
                <p>
                  {{ selectedVideo.subtitle }}
                  <template v-if="currentEpisode"> Сейчас выбран: {{ currentSeason.title }}, {{ currentEpisode.title }}.</template>
                </p>
                <UiProgress :value="selectedVideo.state.progress" size="sm" aria-label="Прогресс просмотра" />
              </div>
            </main>

            <aside class="mevideo-watch__settings">
              <h2>{{ selectedVideo.seasons?.length ? "Сезоны и серии" : "Настройки просмотра" }}</h2>

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

              <UiSelect label="Качество" :model-value="playbackSettings[selectedVideo.id]?.quality ?? selectedVideo.state.quality" :options="selectedVideo.video?.quality ?? []" @update:model-value="updatePlaybackSetting('quality', $event)" />
              <UiSelect label="Субтитры" :model-value="playbackSettings[selectedVideo.id]?.subtitles ?? selectedVideo.state.subtitles" :options="selectedVideo.video?.subtitles ?? []" @update:model-value="updatePlaybackSetting('subtitles', $event)" />
              <UiSelect label="Озвучка" :model-value="playbackSettings[selectedVideo.id]?.voice ?? selectedVideo.state.voice" :options="selectedVideo.video?.voice ?? []" @update:model-value="updatePlaybackSetting('voice', $event)" />
              <UiButton unstyled :to="`/space/${selectedVideo.spaceId}/publication/${selectedVideo.id}`">Открыть публикацию</UiButton>
            </aside>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
