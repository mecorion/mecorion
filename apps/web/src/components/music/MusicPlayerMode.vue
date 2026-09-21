<script setup>
import {computed, onBeforeUnmount, onMounted} from "vue";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {formatPlaybackTime} from "@/utils/music.js";
import UiButton from "@/components/ui/UiButton.vue";
import UiSlider from "@/components/ui/UiSlider.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const player = useMusicPlayerStore();

const progress = computed(() => player.duration ? (player.currentTime / player.duration) * 100 : 0);
const volumeIconName = computed(() => player.isMuted || player.volume === 0 ? "volume-x" : player.volume < 0.5 ? "volume-low" : "volume-high");
const upcomingTracks = computed(() => {
  const currentIndex = player.queueIds.indexOf(player.currentTrackId);
  if (currentIndex < 0) return player.queueTracks;
  return [...player.queueTracks.slice(currentIndex + 1), ...player.queueTracks.slice(0, currentIndex)];
});

function seek(value) {
  if (!player.duration) return;
  player.requestSeek((Number(value) / 100) * player.duration);
}

function handleKeydown(event) {
  if (event.key === "Escape" && player.isPlayerModeOpen) player.closePlayerMode();
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Transition name="memusic-player-mode">
    <section v-if="player.isPlayerModeOpen" class="memusic-player-mode" aria-label="Режим плеера">
      <header class="memusic-player-mode__header">
        <div><span class="memusic-brand__mark">M</span><strong>Mecorion Music</strong></div>
        <span>Сейчас играет</span>
        <UiButton unstyled aria-label="Закрыть режим плеера" @click="player.closePlayerMode"><SvgIcon name="x" /></UiButton>
      </header>

      <div class="memusic-player-mode__body">
        <main class="memusic-player-mode__now">
          <div class="memusic-player-mode__art">
            <MusicArtwork :track="player.currentTrack" :label="player.currentTrack?.title" />
          </div>

          <div class="memusic-player-mode__details">
            <div class="memusic-player-mode__title">
              <div><h1>{{ player.currentTrack?.title }}</h1><p>{{ player.currentTrack?.artist }}</p><small>{{ player.currentTrack?.album }}</small></div>
              <UiButton unstyled
                :class="{'is-active': player.likedTrackIds.includes(player.currentTrackId)}"
                type="button"
                :aria-label="player.likedTrackIds.includes(player.currentTrackId) ? 'Убрать из любимых' : 'Добавить в любимые'"
                @click="player.toggleLike(player.currentTrackId)"
              ><SvgIcon name="heart" /></UiButton>
            </div>

            <div class="memusic-player-mode__progress">
              <UiSlider :model-value="progress" :min="0" :max="100" :step="0.1" label="Позиция трека" @update:model-value="seek" />
              <div><span>{{ formatPlaybackTime(player.currentTime) }}</span><span>{{ formatPlaybackTime(player.duration) }}</span></div>
            </div>

            <div class="memusic-player-mode__controls">
              <UiButton unstyled :class="{'is-active': player.isShuffle}" aria-label="Перемешать" @click="player.toggleShuffle"><SvgIcon name="shuffle" /></UiButton>
              <UiButton unstyled aria-label="Предыдущий трек" @click="player.previousTrack"><SvgIcon name="skip-back" /></UiButton>
              <UiButton unstyled class="memusic-player-mode__play" :aria-label="player.isPlaying ? 'Пауза' : 'Воспроизвести'" @click="player.togglePlayback"><SvgIcon :name="player.isPlaying ? 'pause' : 'play'" /></UiButton>
              <UiButton unstyled aria-label="Следующий трек" @click="player.nextTrack()"><SvgIcon name="skip-forward" /></UiButton>
              <UiButton unstyled :class="{'is-active': player.repeatMode !== 'off'}" aria-label="Изменить режим повтора" @click="player.cycleRepeatMode"><SvgIcon :name="player.repeatMode === 'one' ? 'repeat-one' : 'repeat'" /></UiButton>
            </div>

            <div class="memusic-player-mode__volume">
              <UiButton unstyled :aria-label="player.isMuted ? 'Включить звук' : 'Выключить звук'" @click="player.toggleMute"><SvgIcon :name="volumeIconName" /></UiButton>
              <UiSlider :model-value="player.volume" :min="0" :max="1" :step="0.01" label="Громкость" @update:model-value="player.setVolume" />
              <span>{{ Math.round((player.isMuted ? 0 : player.volume) * 100) }}%</span>
            </div>
          </div>
        </main>

        <aside class="memusic-player-mode__queue">
          <header><div><span>Далее</span><h2>Очередь</h2></div><strong>{{ upcomingTracks.length }}</strong></header>
          <div class="memusic-player-mode__queue-list">
            <UiButton unstyled
              v-for="(track, index) in upcomingTracks"
              :key="track.id"
              type="button"
              @click="player.playTrack(track.id)"
            >
              <span class="memusic-player-mode__queue-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <MusicArtwork :track="track" />
              <span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
              <small>{{ track.durationLabel }}</small>
            </UiButton>
          </div>
        </aside>
      </div>
    </section>
  </Transition>
</template>
