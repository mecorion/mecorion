<script setup>
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiEmptyState from "@/components/ui/UiEmptyState.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({
  tracks: {type: Array, required: true},
  title: {type: String, default: ""},
  emptyText: {type: String, default: "Здесь пока нет треков"},
});

const player = useMusicPlayerStore();

function play(track) {
  player.playTrack(track.id, props.tracks.map((item) => item.id));
}
</script>

<template>
  <section class="memusic-track-section">
    <div v-if="title" class="memusic-section-heading">
      <h2>{{ title }}</h2><span>{{ tracks.length }} трека</span>
    </div>

    <div v-if="tracks.length" class="memusic-track-list">
      <div
        v-for="(track, index) in tracks"
        :key="track.id"
        class="memusic-track-row"
        :class="{'memusic-track-row--active': player.currentTrackId === track.id, 'memusic-track-row--unavailable': !track.available}"
      >
        <UiButton unstyled class="memusic-track-row__main" :disabled="!track.available" @click="play(track)">
          <span class="memusic-track-row__number"><SvgIcon v-if="player.currentTrackId === track.id && player.isPlaying" name="music" /><template v-else>{{ index + 1 }}</template></span>
          <MusicArtwork :track="track" />
          <span class="memusic-track-row__title"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
          <span class="memusic-track-row__album">{{ track.album }}</span>
        </UiButton>
        <UiButton unstyled
          class="memusic-track-row__like"
          :class="{'is-active': player.likedTrackIds.includes(track.id)}"
          type="button"
          :aria-label="player.likedTrackIds.includes(track.id) ? 'Убрать из любимых' : 'Добавить в любимые'"
          @click="player.toggleLike(track.id)"
        ><SvgIcon name="heart" /></UiButton>
        <span class="memusic-track-row__duration">{{ track.durationLabel }}</span>
      </div>
    </div>
    <UiEmptyState v-else class="memusic-empty-state" :title="emptyText" size="sm" />
  </section>
</template>
