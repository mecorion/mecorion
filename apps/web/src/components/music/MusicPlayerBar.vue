<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {formatPlaybackTime} from "@/utils/music.js";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSlider from "@/components/ui/UiSlider.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const player = useMusicPlayerStore();
const audio = ref(null);

const progress = computed(() => player.duration ? (player.currentTime / player.duration) * 100 : 0);
const volumeIconName = computed(() => player.isMuted || player.volume === 0 ? "volume-x" : player.volume < 0.5 ? "volume-low" : "volume-high");
const repeatLabel = computed(() => player.repeatMode === "one" ? "Повтор трека" : player.repeatMode === "all" ? "Повтор очереди" : "Повтор выключен");

async function applyPlaybackState() {
  if (!audio.value || !player.currentTrack?.source) return;

  if (!player.isPlaying) {
    audio.value.pause();
    return;
  }

  try {
    await audio.value.play();
  } catch {
    // Браузер может запретить play() без пользовательского жеста.
    player.isPlaying = false;
  }
}

function togglePlaybackFromControl() {
  if (!audio.value || !player.currentTrack?.source) return;

  // Прямой вызов из click-handler сохраняет user activation. Watcher ниже
  // остаётся нужен для команд из других компонентов и системных media keys.
  if (audio.value.paused) {
    player.isPlaying = true;
    // Не ждём Promise от медиадекодера в обработчике клика: на некоторых
    // устройствах подготовка аудиовыхода занимает заметное время.
    void applyPlaybackState();
  } else {
    player.isPlaying = false;
    audio.value.pause();
  }
}

function loadCurrentTrack() {
  if (!audio.value || !player.currentTrack?.source) return;
  audio.value.src = player.currentTrack.source;
  audio.value.load();
  syncMediaSession();
}

function seek(value) {
  if (!player.duration) return;
  player.requestSeek((Number(value) / 100) * player.duration);
}

function changeVolume(value) {
  player.setVolume(Number(value));
}

function playPrevious() {
  // Как в большинстве музыкальных приложений: после трех секунд кнопка
  // Previous перезапускает текущий трек, а не меняет композицию.
  if (audio.value && audio.value.currentTime > 3) {
    audio.value.currentTime = 0;
    return;
  }
  player.previousTrack();
}

function syncMediaSession() {
  if (!("mediaSession" in navigator) || !("MediaMetadata" in window) || !player.currentTrack) return;

  const metadata = {
    title: player.currentTrack.title,
    artist: player.currentTrack.artist,
    album: player.currentTrack.album,
  };

  // Локальный файл может не иметь обложки, поэтому artwork добавляется только
  // когда у каталога действительно есть URL изображения.
  if (player.currentTrack.cover) {
    metadata.artwork = [{src: player.currentTrack.cover, sizes: "640x640", type: "image/svg+xml"}];
  }

  navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

onMounted(() => {
  player.initialize();

  // Media Session связывает аппаратные кнопки клавиатуры и системный плеер
  // операционной системы с нашим Pinia-store.
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => { player.isPlaying = true; });
    navigator.mediaSession.setActionHandler("pause", () => { player.isPlaying = false; });
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", () => player.nextTrack());
  }
});

onBeforeUnmount(() => {
  if (!("mediaSession" in navigator)) return;
  ["play", "pause", "previoustrack", "nexttrack"].forEach((action) => navigator.mediaSession.setActionHandler(action, null));
});

// flush: "sync" здесь принципиален: play() должен быть вызван внутри того же
// пользовательского события, иначе autoplay policy может заблокировать звук.
watch(() => player.currentTrackId, loadCurrentTrack, {flush: "sync"});
watch(() => player.isPlaying, applyPlaybackState, {flush: "sync"});
watch(() => player.seekRevision, () => {
  if (audio.value) audio.value.currentTime = Math.min(player.seekTarget, player.duration || player.seekTarget);
});
watch(() => [player.volume, player.isMuted], () => {
  if (audio.value) audio.value.volume = player.isMuted ? 0 : player.volume;
}, {immediate: true});
</script>

<template>
  <footer class="memusic-player">
    <div v-if="player.currentTrack" class="memusic-player__track">
      <UiButton unstyled class="memusic-player__artwork-button" aria-label="Открыть режим плеера" @click="player.openPlayerMode">
        <MusicArtwork :track="player.currentTrack" />
      </UiButton>
      <div><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></div>
      <UiButton unstyled
        class="memusic-player__like-button"
        :class="{'is-active': player.likedTrackIds.includes(player.currentTrack.id)}"
        type="button"
        :aria-label="player.likedTrackIds.includes(player.currentTrack.id) ? 'Убрать из любимых' : 'Добавить в любимые'"
        @click="player.toggleLike(player.currentTrack.id)"
      ><SvgIcon name="heart" /></UiButton>
    </div>

    <div class="memusic-player__center">
      <div class="memusic-player__controls">
        <UiButton unstyled :class="{'is-active': player.isShuffle}" aria-label="Перемешать" @click="player.toggleShuffle"><SvgIcon name="shuffle" /></UiButton>
        <UiButton unstyled aria-label="Предыдущий трек" @click="playPrevious"><SvgIcon name="skip-back" /></UiButton>
        <UiButton unstyled class="memusic-player__play" :aria-label="player.isPlaying ? 'Пауза' : 'Воспроизвести'" @click="togglePlaybackFromControl"><SvgIcon :name="player.isPlaying ? 'pause' : 'play'" /></UiButton>
        <UiButton unstyled aria-label="Следующий трек" @click="player.nextTrack()"><SvgIcon name="skip-forward" /></UiButton>
        <UiButton unstyled :class="{'is-active': player.repeatMode !== 'off'}" :aria-label="repeatLabel" @click="player.cycleRepeatMode"><SvgIcon :name="player.repeatMode === 'one' ? 'repeat-one' : 'repeat'" /></UiButton>
      </div>
      <div class="memusic-player__progress">
        <span>{{ formatPlaybackTime(player.currentTime) }}</span>
        <UiSlider :model-value="progress" :min="0" :max="100" :step="0.1" label="Позиция трека" @update:model-value="seek" />
        <span>{{ formatPlaybackTime(player.duration) }}</span>
      </div>
    </div>

    <div class="memusic-player__tools">
      <UiButton unstyled aria-label="Открыть режим плеера" @click="player.openPlayerMode"><SvgIcon name="maximize" /></UiButton>
      <UiButton unstyled :class="{'is-active': player.isQueueOpen}" aria-label="Открыть очередь" @click="player.isQueueOpen = !player.isQueueOpen"><SvgIcon name="list-music" /></UiButton>
      <UiButton unstyled :aria-label="player.isMuted ? 'Включить звук' : 'Выключить звук'" @click="player.toggleMute"><SvgIcon :name="volumeIconName" /></UiButton>
      <UiSlider :model-value="player.volume" :min="0" :max="1" :step="0.01" label="Громкость" @update:model-value="changeVolume" />
    </div>

    <audio
      ref="audio"
      :src="player.currentTrack?.source || undefined"
      preload="metadata"
      @play="player.isPlaying = true"
      @pause="player.isPlaying = false"
      @timeupdate="player.currentTime = audio?.currentTime || 0"
      @loadedmetadata="player.duration = audio?.duration || 0"
      @ended="player.nextTrack({automatic: true})"
    ></audio>
  </footer>
</template>
