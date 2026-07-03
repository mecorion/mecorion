<script setup>
defineProps({
  track: {type: Object, default: null},
  label: {type: String, default: ""},
});
</script>

<template>
  <div class="memusic-artwork" :class="`memusic-artwork--${track?.accent ?? 'rose'}`">
    <img v-if="track?.cover" :src="track.cover" :alt="`Обложка: ${track.title}`" />
    <span v-else aria-hidden="true">{{ label.slice(0, 1) || 'M' }}</span>
  </div>
</template>
