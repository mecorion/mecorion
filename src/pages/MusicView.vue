<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {RouterLink} from "vue-router";

const audioFiles = import.meta.glob("../assets/music/*.{mp3,ogg,wav,m4a,flac}", {
  eager: true,
  import: "default",
});

const tracks = Object.entries(audioFiles).map(([path, source], index) => {
  const filename = path.split("/").pop().replace(/\.[^/.]+$/, "");
  const [artist, title] = filename.includes(" - ") ? filename.split(" - ") : ["Моя медиатека", filename];

  return {
    id: index,
    artist,
    title,
    source,
    duration: "--:--",
    tone: ["rose", "violet", "cyan", "gold"][index % 4],
  };
});

const audio = ref(null);
const query = ref("");
const currentIndex = ref(0);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const repeat = ref(false);

const currentTrack = computed(() => tracks[currentIndex.value] ?? null);
const filteredTracks = computed(() => {
  const normalized = query.value.trim().toLowerCase();
  if (!normalized) return tracks;

  return tracks.filter((track) => `${track.artist} ${track.title}`.toLowerCase().includes(normalized));
});
const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0);

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function togglePlayback() {
  if (!currentTrack.value || !audio.value) return;

  if (isPlaying.value) {
    audio.value.pause();
  } else {
    await audio.value.play();
  }
}

async function selectTrack(track) {
  currentIndex.value = track.id;
  currentTime.value = 0;
  await nextTick();
  await audio.value?.play();
}

async function moveTrack(direction) {
  if (!tracks.length) return;
  currentIndex.value = (currentIndex.value + direction + tracks.length) % tracks.length;
  currentTime.value = 0;
  await nextTick();
  await audio.value?.play();
}

function seek(event) {
  if (!audio.value || !duration.value) return;
  audio.value.currentTime = (Number(event.target.value) / 100) * duration.value;
}

function handleEnded() {
  if (repeat.value) {
    audio.value.currentTime = 0;
    audio.value.play();
    return;
  }
  moveTrack(1);
}

watch(currentIndex, () => {
  isPlaying.value = false;
});
</script>

<template>
  <div class="mecorion-workspace music-view">
    <aside class="music-sidebar">
      <RouterLink class="workspace-brand" to="/dashboard">
        <span class="workspace-brand__mark">M</span>
        <span>Mecorion</span>
      </RouterLink>

      <div class="music-sidebar__service">
        <span class="service-icon service-icon--rose">♪</span>
        <div><strong>Музыка</strong><small>Личная медиатека</small></div>
      </div>

      <nav class="music-nav" aria-label="Навигация музыки">
        <button class="music-nav__item music-nav__item--active" type="button"><span>⌂</span>Главная</button>
        <button class="music-nav__item" type="button"><span>⌕</span>Поиск</button>
        <button class="music-nav__item" type="button"><span>≡</span>Моя очередь</button>
      </nav>

      <RouterLink class="music-sidebar__back" to="/dashboard">← Все сервисы</RouterLink>
    </aside>

    <main class="music-main">
      <header class="music-header">
        <div>
          <p class="workspace-eyebrow">Mecorion Music</p>
          <h1>Ваша музыка</h1>
        </div>
        <label class="music-search">
          <span aria-hidden="true">⌕</span>
          <input v-model="query" type="search" placeholder="Найти в медиатеке" />
        </label>
      </header>

      <section v-if="currentTrack" class="music-now-playing">
        <div class="album-art" :class="`album-art--${currentTrack.tone}`" aria-hidden="true">
          <span>{{ currentTrack.title.slice(0, 1) }}</span>
        </div>
        <div class="music-now-playing__copy">
          <p class="workspace-eyebrow">Сейчас играет</p>
          <h2>{{ currentTrack.title }}</h2>
          <p>{{ currentTrack.artist }}</p>
          <div class="music-player__controls">
            <button class="player-control" type="button" aria-label="Предыдущий трек" @click="moveTrack(-1)">↶</button>
            <button class="player-control player-control--play" type="button" :aria-label="isPlaying ? 'Пауза' : 'Воспроизвести'" @click="togglePlayback">
              {{ isPlaying ? 'Ⅱ' : '▶' }}
            </button>
            <button class="player-control" type="button" aria-label="Следующий трек" @click="moveTrack(1)">↷</button>
            <button class="player-control" :class="{'player-control--active': repeat}" type="button" aria-label="Повтор" @click="repeat = !repeat">↻</button>
          </div>
        </div>
        <div class="music-now-playing__progress">
          <div class="track-time"><span>{{ formatTime(currentTime) }}</span><span>{{ formatTime(duration) }}</span></div>
          <input aria-label="Прогресс трека" type="range" min="0" max="100" :value="progress" @input="seek" />
        </div>
      </section>

      <section v-else class="music-empty">
        <div class="music-empty__mark" aria-hidden="true">♪</div>
        <div>
          <p class="workspace-eyebrow">Медиатека пуста</p>
          <h2>Добавьте музыку в <code>src/assets/music</code></h2>
          <p>После обновления страницы сервис автоматически подхватит локальные треки.</p>
        </div>
      </section>

      <section class="music-library">
        <div class="music-library__header">
          <div><p class="workspace-eyebrow">Коллекция</p><h2>Все треки</h2></div>
          <span>{{ filteredTracks.length }} {{ filteredTracks.length === 1 ? 'трек' : 'треков' }}</span>
        </div>

        <div v-if="filteredTracks.length" class="track-list">
          <button
            v-for="(track, index) in filteredTracks"
            :key="track.id"
            class="track-row"
            :class="{'track-row--active': track.id === currentTrack?.id}"
            type="button"
            @click="selectTrack(track)"
          >
            <span class="track-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="track-row__art" :class="`track-row__art--${track.tone}`">{{ track.title.slice(0, 1) }}</span>
            <span class="track-row__copy"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
            <span class="track-row__duration">{{ track.id === currentTrack?.id ? formatTime(duration) : track.duration }}</span>
          </button>
        </div>
        <div v-else class="track-list__empty">Здесь появятся ваши аудиофайлы.</div>
      </section>

      <audio
        v-if="currentTrack"
        ref="audio"
        :src="currentTrack.source"
        :loop="repeat"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @timeupdate="currentTime = audio?.currentTime || 0"
        @loadedmetadata="duration = audio?.duration || 0"
        @ended="handleEnded"
      ></audio>
    </main>
  </div>
</template>
