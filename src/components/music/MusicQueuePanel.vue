<script setup>
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import MusicArtwork from "@/components/music/MusicArtwork.vue";

const player = useMusicPlayerStore();
</script>

<template>
  <aside v-if="player.isQueueOpen" class="memusic-queue memusic-queue--open" aria-label="Очередь воспроизведения">
    <header><div><span>Сейчас играет</span><strong>Очередь</strong></div><button type="button" aria-label="Закрыть очередь" @click="player.isQueueOpen = false">×</button></header>

    <div v-if="player.currentTrack" class="memusic-queue__current">
      <MusicArtwork :track="player.currentTrack" />
      <div><strong>{{ player.currentTrack.title }}</strong><small>{{ player.currentTrack.artist }}</small></div>
    </div>

    <p class="memusic-queue__label">Далее</p>
    <div class="memusic-queue__list">
      <button
        v-for="track in player.queueTracks.filter((item) => item.id !== player.currentTrackId)"
        :key="track.id"
        type="button"
        @click="player.playTrack(track.id)"
      >
        <MusicArtwork :track="track" />
        <span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
        <span aria-hidden="true">⋮</span>
      </button>
    </div>
  </aside>
</template>
