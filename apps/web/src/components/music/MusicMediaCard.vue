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
const emit = defineEmits(["open"]);

const player = useMusicPlayerStore();
const tracks = computed(() => getTracksByIds(props.playlist.trackIds));
const canPlay = computed(() => tracks.value.some((track) => player.tracks.find((item) => item.id === track.id)?.available));
const isLiked = computed(() => player.likedPlaylistIds.includes(props.playlist.id));

function playPlaylist() {
  player.playCollection(tracks.value.map((track) => track.id));
}
</script>

<template>
  <UiCard raw unstyled class="memusic-media-card">
    <div class="memusic-media-card__cover">
      <img :src="playlist.cover" :alt="`Обложка плейлиста ${playlist.title}`" />
      <div class="memusic-media-card__overlay">
        <UiButton unstyled class="memusic-media-card__play" :disabled="!canPlay" :aria-label="`Включить ${playlist.title}`" :title="canPlay ? `Включить ${playlist.title}` : 'Аудио пока недоступно'" @click="playPlaylist"><SvgIcon name="play" /></UiButton>
        <UiButton unstyled class="memusic-media-card__like" :class="{'is-active': isLiked}" :aria-label="isLiked ? `Убрать ${playlist.title} из избранного` : `Добавить ${playlist.title} в избранное`" :aria-pressed="isLiked" @click="player.togglePlaylistLike(playlist.id)"><SvgIcon name="heart" /></UiButton>
      </div>
    </div>
    <strong><UiButton unstyled class="memusic-media-card__title" @click="emit('open', playlist.id)">{{ playlist.title }}</UiButton></strong>
    <p>{{ playlist.description }}</p>
  </UiCard>
</template>
