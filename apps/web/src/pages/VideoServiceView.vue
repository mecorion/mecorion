<script setup>
import {computed, ref} from "vue";
import {RouterLink} from "vue-router";
import {
  getSpaceBreadcrumb,
  getVideoServicePublications,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const activeSection = ref("home");
const activeFilter = ref("Все");
const activeQuality = ref("Любое качество");
const searchQuery = ref("");
const selectedVideoId = ref(null);

const navigation = [
  {id: "home", icon: "⌂", title: "Главная", shortTitle: "Главная"},
  {id: "search", icon: "⌕", title: "Поиск", shortTitle: "Поиск"},
  {id: "library", icon: "▤", title: "Медиатека", shortTitle: "Видео"},
  {id: "watchLater", icon: "◇", title: "Смотреть позже", shortTitle: "Позже"},
  {id: "watch", icon: "▣", title: "Плеер", shortTitle: "Плеер"},
];

const filters = ["Все", "Фильмы", "Сериалы", "Подборки", "Продолжить", "Позже"];
const qualities = ["Любое качество", "2160p", "1440p", "1080p", "720p"];

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
];

const decoratedVideos = computed(() => [...getVideoServicePublications(), ...fallbackVideos].map((video, index) => ({
  ...video,
  state: videoStateById[video.id] ?? {
    progress: index % 2 ? 0 : 7,
    watchedMinutes: index % 2 ? 0 : 5,
    totalMinutes: Number.parseInt(video.duration, 10) || 45,
    saved: index % 2 === 0,
    kind: index % 3 === 0 ? "Сериал" : "Фильм",
    quality: video.video?.quality?.[0] ?? "1080p",
    voice: video.video?.voice?.[0] ?? "Оригинал",
    subtitles: video.video?.subtitles?.[0] ?? "Русские",
  },
})));

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
  activeSection.value = "watch";
}
</script>

<template>
  <div class="mevideo-app">
    <aside class="mevideo-sidebar" aria-label="Навигация Video">
      <RouterLink class="mevideo-brand" to="/dashboard" aria-label="Вернуться в Mecorion">
        <span class="mevideo-brand__mark">M</span>
        <span><strong>Mecorion</strong><small>Video</small></span>
      </RouterLink>

      <nav class="mevideo-navigation" aria-label="Разделы Video">
        <button
          v-for="item in navigation"
          :key="item.id"
          class="mevideo-navigation__item"
          :class="{'mevideo-navigation__item--active': activeSection === item.id}"
          type="button"
          @click="navigate(item.id)"
        >
          <span class="mevideo-navigation__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="mevideo-navigation__title">{{ item.title }}</span>
          <span class="mevideo-navigation__short-title">{{ item.shortTitle }}</span>
        </button>
      </nav>

      <div class="mevideo-sidebar__library">
        <div class="mevideo-sidebar__label"><span>Коллекции</span><button type="button" aria-label="Создать коллекцию">＋</button></div>
        <button v-for="collection in collections" :key="collection.title" type="button" @click="activeSection = 'library'">
          <span aria-hidden="true">{{ collection.icon }}</span>
          {{ collection.title }}
          <small>{{ collection.count }}</small>
        </button>
      </div>

      <RouterLink class="mevideo-sidebar__exit" to="/dashboard"><span aria-hidden="true">←</span> Все сервисы</RouterLink>
    </aside>

    <section class="mevideo-workspace">
      <header class="mevideo-header">
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
          <button class="mevideo-icon-button" type="button" aria-label="Картинка в картинке">▢</button>
          <button class="mevideo-profile" type="button"><span>ИИ</span><strong>Иван</strong></button>
        </div>
      </header>

      <main class="mevideo-content">
        <template v-if="activeSection === 'home'">
          <section class="mevideo-hero">
            <article class="mevideo-hero__player" :class="`space-publication-card--${continueVideo.coverTone}`">
              <span>Продолжить просмотр</span>
              <h1>{{ continueVideo.title }}</h1>
              <p>{{ continueVideo.subtitle }}</p>
              <div class="mevideo-progress"><i :style="{width: `${continueVideo.state.progress}%`}"></i></div>
              <button type="button" @click="openWatch(continueVideo.id)">▶ Смотреть</button>
            </article>

            <div class="mevideo-hero__copy">
              <p class="mevideo-kicker">Mecorion Video</p>
              <h2>Фильмы, сериалы и видео в одном удобном сервисе</h2>
              <p>Video помогает искать контент, выбирать качество, субтитры и озвучку, продолжать просмотр и собирать личные коллекции.</p>
              <div class="mevideo-hero__stats">
                <span><strong>{{ decoratedVideos.length }}</strong> материалов</span>
                <span><strong>{{ savedVideos.length }}</strong> позже</span>
              </div>
            </div>
          </section>

          <section class="mevideo-collection-grid" aria-label="Быстрые коллекции">
            <button v-for="collection in collections" :key="collection.title" type="button" @click="activeSection = 'library'">
              <span aria-hidden="true">{{ collection.icon }}</span>
              <strong>{{ collection.title }}</strong>
              <small>{{ collection.count }} материалов</small>
            </button>
          </section>

          <section class="mevideo-section">
            <div class="mevideo-section-heading"><h2>Рекомендуем посмотреть</h2><button type="button" @click="activeSection = 'library'">Смотреть всё</button></div>
            <div class="mevideo-card-grid">
              <article
                v-for="video in decoratedVideos"
                :key="video.id"
                class="mevideo-card"
                :class="`space-publication-card--${video.coverTone}`"
              >
                <span>{{ video.state.kind }}</span>
                <h3>{{ video.title }}</h3>
                <p>{{ video.subtitle }}</p>
                <div class="mevideo-progress"><i :style="{width: `${video.state.progress}%`}"></i></div>
                <footer><small>{{ video.state.quality }} · {{ video.state.voice }}</small><button type="button" @click="openWatch(video.id)">Смотреть</button></footer>
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
                <p>{{ selectedVideo.subtitle }}</p>
                <div class="mevideo-progress"><i :style="{width: `${selectedVideo.state.progress}%`}"></i></div>
              </div>
            </main>

            <aside class="mevideo-watch__settings">
              <h2>Настройки просмотра</h2>
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
