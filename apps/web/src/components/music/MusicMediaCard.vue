<script setup>
import {computed} from "vue";
import {getTracksByIds} from "@/music/catalog.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";

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
  <UiCard raw unstyled class="memusic-media-card">
    <div class="memusic-media-card__cover">
      <img :src="playlist.cover" :alt="`Обложка плейлиста ${playlist.title}`" />
      <UiButton unstyled :aria-label="`Включить ${playlist.title}`" @click="playPlaylist"><SvgIcon name="play" /></UiButton>
    </div>
    <strong>{{ playlist.title }}</strong>
    <p>{{ playlist.description }}</p>
  </UiCard>
</template>
