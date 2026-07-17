<script setup>
import {computed} from "vue";
import {getTracksByIds} from "@/music/catalog.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";

const props = defineProps({
  playlist: {type: Object, required: true},
});

const player = useMusicPlayerStore();
const tracks = computed(() => getTracksByIds(props.playlist.trackIds));

function playPlaylist() {
  player.playCollection(tracks.value.map((track) => track.id));
}
</script>

<template>
  <article class="memusic-media-card">
    <div class="memusic-media-card__cover">
      <img :src="playlist.cover" :alt="`Обложка плейлиста ${playlist.title}`" />
      <button type="button" :aria-label="`Включить ${playlist.title}`" @click="playPlaylist">▶</button>
    </div>
    <strong>{{ playlist.title }}</strong>
    <p>{{ playlist.description }}</p>
  </article>
</template>
