<script setup>
import {computed, onBeforeUnmount, ref, watch} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiBadge, UiButton, UiSlider} from "@/components/ui";

const props = defineProps({video: {type: Object, required: true}, speed: {type: Number, default: 1}});
const emit = defineEmits(["settings"]);
const frame = ref(null);
const media = ref(null);
const playing = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(80);
const muted = ref(false);
const error = ref("");
const notice = ref("");
const source = computed(() => props.video.video?.src ?? "");
const available = computed(() => Boolean(source.value) && !error.value);
const ready = computed(() => available.value && duration.value > 0);

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)}:` : ""}${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
async function togglePlayback() {
  if (!available.value || !media.value) return;
  if (media.value.paused) {
    try { await media.value.play(); } catch { error.value = "Не удалось воспроизвести видео. Попробуйте открыть его снова."; }
  } else media.value.pause();
}
function seek(value) {
  if (!ready.value) return;
  media.value.currentTime = Math.min(duration.value, Math.max(0, value));
  currentTime.value = media.value.currentTime;
}
function syncDuration() {
  duration.value = Number.isFinite(media.value?.duration) ? media.value.duration : 0;
  if (media.value) { media.value.volume = volume.value / 100; media.value.muted = muted.value; media.value.playbackRate = props.speed; }
}
function setVolume(value) { volume.value = value; if (media.value) media.value.volume = value / 100; }
function toggleMute() { if (!available.value) return; muted.value = !muted.value; if (media.value) media.value.muted = muted.value; }
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await frame.value?.requestFullscreen();
  } catch { notice.value = "Полноэкранный режим недоступен в этом браузере."; }
}
async function openSettings() {
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch { return; }
  }
  emit("settings");
}
function handleKey(event) {
  if (event.target !== frame.value || event.altKey || event.ctrlKey || event.metaKey) return;
  const actions = {" ": togglePlayback, k: togglePlayback, m: toggleMute, f: fullscreen, ArrowLeft: () => seek(currentTime.value - 5), ArrowRight: () => seek(currentTime.value + 5)};
  if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
}
watch(() => props.speed, value => { if (media.value) media.value.playbackRate = value; });
watch(() => props.video.id, () => { playing.value = false; currentTime.value = 0; duration.value = 0; error.value = ""; });
onBeforeUnmount(() => media.value?.pause());
</script>

<template>
  <section ref="frame" class="mevideo-player" tabindex="0" aria-label="Видеоплеер" @keydown="handleKey">
    <div class="mevideo-player__viewport">
      <video v-if="source" ref="media" :key="source" :src="source" :poster="video.coverUrl" playsinline preload="metadata" @loadedmetadata="syncDuration" @durationchange="syncDuration" @timeupdate="currentTime = media.currentTime" @play="playing = true" @pause="playing = false" @ended="playing = false" @error="error = 'Не удалось загрузить видео. Попробуйте открыть его снова.'" @click="togglePlayback" />
      <img v-else-if="video.coverUrl" class="mevideo-player__poster" :src="video.coverUrl" alt="" />
      <div v-else class="mevideo-player__art" aria-hidden="true"></div>
      <div v-if="!available" class="mevideo-player__empty" role="status"><SvgIcon name="play" /><strong>{{ error ? 'Видео недоступно' : 'Видео скоро появится' }}</strong><p>{{ error || 'Видеофайл ещё не добавлен к публикации.' }}</p></div>
      <UiButton v-else-if="!playing" class="mevideo-player__center" variant="secondary" icon aria-label="Воспроизвести видео" @click="togglePlayback"><SvgIcon name="play" /></UiButton>
      <div class="mevideo-player__badge"><UiBadge>{{ video.state.kind }}</UiBadge></div>
    </div>
    <p v-if="notice" class="mevideo-player__notice" role="status">{{ notice }}</p>
    <div class="mevideo-player__controls">
      <UiSlider class="mevideo-player__timeline" :model-value="currentTime" :max="duration || 1" :step="0.1" :disabled="!ready" label="Позиция воспроизведения" :tooltip-formatter="formatTime" @update:model-value="seek" />
      <div class="mevideo-player__bar">
        <div class="mevideo-player__transport">
          <UiButton variant="ghost" icon :disabled="!available" :aria-label="playing ? 'Пауза' : 'Воспроизвести'" :title="playing ? 'Пауза (K)' : 'Воспроизвести (K)'" @click="togglePlayback"><SvgIcon :name="playing ? 'pause' : 'play'" /></UiButton>
          <UiButton variant="ghost" icon :disabled="!ready" aria-label="Назад на 10 секунд" title="Назад на 10 секунд" @click="seek(currentTime - 10)"><SvgIcon name="skip-back" /></UiButton>
          <UiButton variant="ghost" icon :disabled="!ready" aria-label="Вперёд на 10 секунд" title="Вперёд на 10 секунд" @click="seek(currentTime + 10)"><SvgIcon name="skip-forward" /></UiButton>
          <span class="mevideo-player__time">{{ formatTime(currentTime) }} <span>/ {{ duration ? formatTime(duration) : '—:—' }}</span></span>
        </div>
        <div class="mevideo-player__tools">
          <UiButton variant="ghost" icon :disabled="!available" :aria-label="muted ? 'Включить звук' : 'Выключить звук'" title="Звук (M)" @click="toggleMute"><SvgIcon :name="muted || !volume ? 'volume-x' : 'volume-high'" /></UiButton>
          <UiSlider class="mevideo-player__volume" :model-value="volume" :disabled="!available" label="Громкость" @update:model-value="setVolume" />
          <UiButton variant="ghost" icon aria-label="Настройки просмотра" title="Настройки просмотра" @click="openSettings"><SvgIcon name="settings" /></UiButton>
          <UiButton variant="ghost" icon aria-label="Полный экран" title="Полный экран (F)" @click="fullscreen"><SvgIcon name="maximize" /></UiButton>
        </div>
      </div>
    </div>
  </section>
</template>
