<script setup>
import SvgIcon from "@/components/SvgIcon.vue";

defineProps({
  track: {type: Object, default: null},
  label: {type: String, default: ""},
  playOverlay: {type: Boolean, default: false},
});
</script>

<template>
  <div class="memusic-artwork" :class="[`memusic-artwork--${track?.accent ?? 'rose'}`, {'memusic-artwork--play': playOverlay}]">
    <img v-if="track?.cover" :src="track.cover" :alt="`Обложка: ${track.title}`" />
    <span v-else aria-hidden="true">{{ label.slice(0, 1) || 'M' }}</span>
    <span v-if="playOverlay" class="memusic-artwork__play" aria-hidden="true"><SvgIcon name="play" /></span>
  </div>
</template>
