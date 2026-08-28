<script setup>
import {computed, ref} from "vue";
import {RouterLink} from "vue-router";
import {useAppStore} from "@/stores/app.js";
import {
  getSpaceBreadcrumb,
  getVideoServicePublications,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const activeSection = ref("home");
const activeFilter = ref("Все");
const activeQuality = ref("Любое качество");
const activeCategory = ref("Все");
const searchQuery = ref("");
const selectedVideoId = ref(null);
const selectedSeason = ref(1);
const selectedEpisodeId = ref(null);
const app = useAppStore();

const navigation = [
  {id: "home", icon: "⌂", title: "Главная", shortTitle: "Главная"},
  {id: "library", icon: "▤", title: "Медиатека", shortTitle: "Видео"},
  {id: "watchLater", icon: "◇", title: "Смотреть позже", shortTitle: "Позже"},
  {id: "watch", icon: "▣", title: "Плеер", shortTitle: "Плеер"},
];

const filters = ["Все", "Фильмы", "Сериалы", "Подборки", "Продолжить", "Позже"];
const qualities = ["Любое качество", "2160p", "1440p", "1080p", "720p"];
const categories = ["Все", "Фильмы", "Сериалы", "Дорамы", "Документальное", "Мультфильмы", "Подборки"];

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
    kind: video.id.includes("drama") ? "Дорама" : video.id.includes("animation") ? "Мультфильм" : video.id.includes("doc") ? "Документальное" : index % 3 === 0 ? "Сериал" : "Фильм",
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
    items = items.filter((item) => item.state.kind === activeCategory.value || activeCategory.value === "Подборки" && item.state.kind === "Подборка");
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
  {title: "Продолжить", count: decoratedVideos.value.filter((video) => video.state.progress > 0).length, icon: "↗"},
  {title: "Смотреть позже", count: savedVideos.value.length, icon: "◇"},
  {title: "4K / 2K", count: decoratedVideos.value.filter((video) => video.video?.quality?.some((quality) => ["2160p", "1440p"].includes(quality))).length, icon: "▣"},
  {title: "С субтитрами", count: decoratedVideos.value.filter((video) => video.video?.subtitles?.length).length, icon: "Aa"},
]);

function navigate(section) {
  activeSection.value = section;
  if (section === "watchLater") {
    activeFilter.value = "Позже";
  }
}

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
    <aside class="mcrn-service-sidebar mevideo-sidebar" aria-label="Навигация Video">
      <RouterLink class="mcrn-service-brand mevideo-brand" to="/dashboard" aria-label="Вернуться в Mecorion">
        <span class="mcrn-service-brand__mark mevideo-brand__mark">M</span>
        <span><strong>Mecorion</strong><small>Video</small></span>
      </RouterLink>

      <nav class="mcrn-service-nav mevideo-navigation" aria-label="Разделы Video">
        <p class="mcrn-service-sidebar__label mevideo-sidebar__group-title">Навигация</p>
        <button
          v-for="item in navigation"
          :key="item.id"
          class="mcrn-service-nav__item mevideo-navigation__item"
          :class="{
            'mcrn-service-nav__item--active': activeSection === item.id,
            'mevideo-navigation__item--active': activeSection === item.id,
          }"
          type="button"
          @click="navigate(item.id)"
        >
          <span class="mcrn-service-nav__icon mevideo-navigation__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="mcrn-service-nav__title mevideo-navigation__title">{{ item.title }}</span>
          <span class="mcrn-service-nav__short-title mevideo-navigation__short-title">{{ item.shortTitle }}</span>
        </button>
      </nav>

      <nav class="mcrn-service-nav mcrn-service-nav--secondary mevideo-category-nav" aria-label="Категории Video">
        <p class="mcrn-service-sidebar__label mevideo-sidebar__group-title">Категории</p>
        <button
          v-for="category in categories"
          :key="category"
          class="mcrn-service-nav__item"
          :class="{'is-active': activeCategory === category}"
          type="button"
          @click="activeCategory = category; activeSection = 'library'"
        >
          <span aria-hidden="true">{{ category === 'Все' ? '▦' : category === 'Фильмы' ? '▶' : category === 'Сериалы' ? '▤' : category === 'Дорамы' ? '◇' : category === 'Документальное' ? '□' : category === 'Мультфильмы' ? '✹' : '◎' }}</span>
          {{ category }}
        </button>
      </nav>

      <div class="mcrn-service-sidebar__section mevideo-sidebar__library">
        <div class="mcrn-service-sidebar__label mevideo-sidebar__label"><span>Коллекции</span><button type="button" aria-label="Создать коллекцию">＋</button></div>
        <button v-for="collection in collections" :key="collection.title" type="button" @click="activeSection = 'library'">
          <span aria-hidden="true">{{ collection.icon }}</span>
          {{ collection.title }}
          <small>{{ collection.count }}</small>
        </button>
      </div>

      <RouterLink class="mcrn-service-sidebar__exit mevideo-sidebar__exit" to="/dashboard"><span aria-hidden="true">←</span> Все сервисы</RouterLink>
    </aside>

    <section class="mevideo-workspace">
      <header class="mevideo-header">
        <RouterLink class="mevideo-header__brand" to="/dashboard" aria-label="Mecorion">
          <span>M</span>
          <strong>Mecorion</strong>
        </RouterLink>

        <label class="mevideo-search">
          <span aria-hidden="true">⌕</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Фильмы, сериалы, подборки"
            @focus="activeSection = 'search'"
          />
          <button v-if="searchQuery" type="button" aria-label="Очистить поиск" @click="searchQuery = ''">×</button>
        </label>

        <div class="mevideo-header__actions">
          <button class="mcrn-header-icon mevideo-icon-button" type="button" aria-label="Сменить тему" @click="app.toggleTheme()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </button>
          <button class="mcrn-header-icon mcrn-header-icon--notify mevideo-icon-button mevideo-icon-button--notify" type="button" aria-label="Уведомления">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.27 21a2 2 0 0 0 3.46 0" />
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            </svg>
            <i aria-hidden="true"></i>
          </button>
          <button class="mcrn-header-profile mevideo-profile" type="button" aria-label="Открыть профиль">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <strong>Иван</strong>
          </button>
        </div>
      </header>

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
                <button type="button" @click="openWatch(heroVideo.id)">▶ Смотреть</button>
                <button type="button" @click="activeSection = 'library'">Подробнее</button>
              </div>
            </div>

            <aside class="mevideo-cinema-hero__continue">
              <span>Продолжить</span>
              <strong>{{ heroVideo.state.watchedMinutes }} / {{ heroVideo.state.totalMinutes }} мин</strong>
              <div class="mevideo-progress"><i :style="{width: `${heroVideo.state.progress}%`}"></i></div>
            </aside>
          </section>

          <section class="mevideo-channel-strip" aria-label="Быстрые фильтры">
            <button
              v-for="category in categories"
              :key="category"
              :class="{'is-active': activeCategory === category}"
              type="button"
              @click="activeCategory = category; activeSection = category === 'Все' ? 'home' : 'library'"
            >
              {{ category }}
            </button>
          </section>

          <section v-for="row in videoRows" :key="row.id" class="mevideo-row">
            <div class="mevideo-section-heading">
              <h2>{{ row.title }}</h2>
              <button
                type="button"
                @click="openRow(row)"
              >
                {{ row.action }}
              </button>
            </div>

            <div :class="row.id === 'series' || row.id === 'drama' ? 'mevideo-wide-row' : 'mevideo-poster-row'">
              <article
                v-for="video in row.items"
                :key="video.id"
                :class="[
                  row.id === 'series' || row.id === 'drama' ? 'mevideo-wide-card' : 'mevideo-poster',
                  `space-publication-card--${video.coverTone}`,
                  {'mevideo-poster--compact': row.id === 'quality'},
                ]"
              >
                <span>{{ video.seasons?.length ? `${video.seasons.length} сезона` : video.state.kind }}</span>
                <h3>{{ video.title }}</h3>
                <p v-if="row.id === 'series' || row.id === 'drama'">{{ video.subtitle }}</p>
                <div v-if="video.state.progress" class="mevideo-progress"><i :style="{width: `${video.state.progress}%`}"></i></div>
                <button type="button" @click="openWatch(video.id)">{{ video.seasons?.length ? "Выбрать серию" : "▶" }}</button>
              </article>
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
              <button v-for="category in categories" :key="category" :class="{'is-active': activeCategory === category}" type="button" @click="activeCategory = category">
                {{ category }}
              </button>
            </div>
            <div class="mevideo-filter-row">
              <button v-for="filter in filters" :key="filter" :class="{'is-active': activeFilter === filter}" type="button" @click="activeFilter = filter">
                {{ filter }}
              </button>
            </div>
            <div class="mevideo-filter-row">
              <button v-for="quality in qualities" :key="quality" :class="{'is-active': activeQuality === quality}" type="button" @click="activeQuality = quality">
                {{ quality }}
              </button>
            </div>
          </section>

          <section class="mevideo-card-grid">
            <article
              v-for="video in videos"
              :key="video.id"
              class="mevideo-card"
              :class="`space-publication-card--${video.coverTone}`"
            >
              <span>{{ publicationTypeLabels[video.type] }}</span>
              <h3>{{ video.title }}</h3>
              <p>{{ video.subtitle }}</p>
              <div class="mevideo-progress"><i :style="{width: `${video.state.progress}%`}"></i></div>
              <footer>
                <small>{{ video.state.quality }} · {{ video.state.subtitles }}</small>
                <button type="button" @click="openWatch(video.id)">Смотреть</button>
              </footer>
              <RouterLink :to="`/space/${video.spaceId}/publication/${video.id}`">{{ getSpaceBreadcrumb(video) || "Каталог Video" }}</RouterLink>
            </article>
          </section>
        </template>

        <template v-else>
          <section class="mevideo-watch">
            <main class="mevideo-watch__player">
              <div class="mevideo-screen" :class="`space-publication-card--${selectedVideo.coverTone}`">
                <button type="button" aria-label="Воспроизвести">▶</button>
                <span>{{ selectedVideo.state.quality }}</span>
              </div>
              <div class="mevideo-watch__meta">
                <p class="mevideo-kicker">{{ selectedVideo.state.kind }}</p>
                <h1>{{ selectedVideo.title }}</h1>
                <p>
                  {{ selectedVideo.subtitle }}
                  <template v-if="currentEpisode"> Сейчас выбран: {{ currentSeason.title }}, {{ currentEpisode.title }}.</template>
                </p>
                <div class="mevideo-progress"><i :style="{width: `${selectedVideo.state.progress}%`}"></i></div>
              </div>
            </main>

            <aside class="mevideo-watch__settings">
              <h2>{{ selectedVideo.seasons?.length ? "Сезоны и серии" : "Настройки просмотра" }}</h2>

              <template v-if="selectedVideo.seasons?.length">
                <div class="mevideo-season-tabs" aria-label="Сезоны">
                  <button
                    v-for="season in selectedVideo.seasons"
                    :key="season.number"
                    :class="{'is-active': currentSeason?.number === season.number}"
                    type="button"
                    @click="chooseSeason(season.number)"
                  >
                    {{ season.title }}
                  </button>
                </div>

                <div class="mevideo-episode-list">
                  <button
                    v-for="episode in currentSeason?.episodes"
                    :key="episode.id"
                    :class="{'is-active': currentEpisode?.id === episode.id}"
                    type="button"
                    @click="selectedEpisodeId = episode.id"
                  >
                    <span>{{ episode.title }}</span>
                    <small>{{ episode.duration }}</small>
                    <i><b :style="{width: `${episode.progress}%`}"></b></i>
                  </button>
                </div>
              </template>

              <label>
                <span>Качество</span>
                <select :value="selectedVideo.state.quality">
                  <option v-for="quality in selectedVideo.video?.quality" :key="quality">{{ quality }}</option>
                </select>
              </label>
              <label>
                <span>Субтитры</span>
                <select :value="selectedVideo.state.subtitles">
                  <option v-for="subtitle in selectedVideo.video?.subtitles" :key="subtitle">{{ subtitle }}</option>
                </select>
              </label>
              <label>
                <span>Озвучка</span>
                <select :value="selectedVideo.state.voice">
                  <option v-for="voice in selectedVideo.video?.voice" :key="voice">{{ voice }}</option>
                </select>
              </label>
              <RouterLink :to="`/space/${selectedVideo.spaceId}/publication/${selectedVideo.id}`">Открыть публикацию</RouterLink>
            </aside>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
