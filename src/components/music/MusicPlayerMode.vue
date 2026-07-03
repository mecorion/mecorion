<script setup>
import {computed, onBeforeUnmount, onMounted} from "vue";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {formatPlaybackTime} from "@/utils/music.js";

const player = useMusicPlayerStore();

const progress = computed(() => player.duration ? (player.currentTime / player.duration) * 100 : 0);
const volumeIcon = computed(() => player.isMuted || player.volume === 0 ? "×" : player.volume < 0.5 ? "◖" : "◕");
const upcomingTracks = computed(() => {
  const currentIndex = player.queueIds.indexOf(player.currentTrackId);
  if (currentIndex < 0) return player.queueTracks;
  return [...player.queueTracks.slice(currentIndex + 1), ...player.queueTracks.slice(0, currentIndex)];
});

function seek(event) {
  if (!player.duration) return;
  player.requestSeek((Number(event.target.value) / 100) * player.duration);
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
        <button type="button" aria-label="Закрыть режим плеера" @click="player.closePlayerMode">×</button>
      </header>

      <div class="memusic-player-mode__body">
        <main class="memusic-player-mode__now">
          <div class="memusic-player-mode__art">
            <MusicArtwork :track="player.currentTrack" :label="player.currentTrack?.title" />
          </div>

          <div class="memusic-player-mode__details">
            <div class="memusic-player-mode__title">
              <div><h1>{{ player.currentTrack?.title }}</h1><p>{{ player.currentTrack?.artist }}</p><small>{{ player.currentTrack?.album }}</small></div>
              <button
                :class="{'is-active': player.likedTrackIds.includes(player.currentTrackId)}"
                type="button"
                :aria-label="player.likedTrackIds.includes(player.currentTrackId) ? 'Убрать из любимых' : 'Добавить в любимые'"
                @click="player.toggleLike(player.currentTrackId)"
              >{{ player.likedTrackIds.includes(player.currentTrackId) ? '♥' : '♡' }}</button>
            </div>

            <div class="memusic-player-mode__progress">
              <input aria-label="Позиция трека" type="range" min="0" max="100" step="0.1" :value="progress" @input="seek" />
              <div><span>{{ formatPlaybackTime(player.currentTime) }}</span><span>{{ formatPlaybackTime(player.duration) }}</span></div>
            </div>

            <div class="memusic-player-mode__controls">
              <button :class="{'is-active': player.isShuffle}" type="button" aria-label="Перемешать" @click="player.toggleShuffle">⌘</button>
              <button type="button" aria-label="Предыдущий трек" @click="player.previousTrack">◀</button>
              <button class="memusic-player-mode__play" type="button" :aria-label="player.isPlaying ? 'Пауза' : 'Воспроизвести'" @click="player.togglePlayback">{{ player.isPlaying ? 'Ⅱ' : '▶' }}</button>
              <button type="button" aria-label="Следующий трек" @click="player.nextTrack()">▶</button>
              <button :class="{'is-active': player.repeatMode !== 'off'}" type="button" aria-label="Изменить режим повтора" @click="player.cycleRepeatMode">{{ player.repeatMode === 'one' ? '↻¹' : '↻' }}</button>
            </div>

            <div class="memusic-player-mode__volume">
              <button type="button" :aria-label="player.isMuted ? 'Включить звук' : 'Выключить звук'" @click="player.toggleMute">{{ volumeIcon }}</button>
              <input aria-label="Громкость" type="range" min="0" max="1" step="0.01" :value="player.volume" @input="player.setVolume($event.target.value)" />
              <span>{{ Math.round((player.isMuted ? 0 : player.volume) * 100) }}%</span>
            </div>
          </div>
        </main>

        <aside class="memusic-player-mode__queue">
          <header><div><span>Далее</span><h2>Очередь</h2></div><strong>{{ upcomingTracks.length }}</strong></header>
          <div class="memusic-player-mode__queue-list">
            <button
              v-for="(track, index) in upcomingTracks"
              :key="track.id"
              type="button"
              @click="player.playTrack(track.id)"
            >
              <span class="memusic-player-mode__queue-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <MusicArtwork :track="track" />
              <span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
              <small>{{ track.durationLabel }}</small>
            </button>
          </div>
        </aside>
      </div>
    </section>
  </Transition>
</template>
