<script setup>
import PlayIcon from '../assets/icons/play.svg';

defineProps({
  video: Object
});
</script>

<template>
  <article class="video-card">
    <div class="legacy-card__body">
      <img :src="video.thumbnail" alt="Обложка видео" class="w-full h-40 object-cover rounded"/>

      <div class="video-card__info">
        <h3>{{ video.title }}</h3>
        <p>{{ video.author }}</p>
      </div>

      <div class="video-card__actions">
        <button class="legacy-button" type="button" aria-label="Воспроизвести" @click="$emit('play', video)">
          <PlayIcon class="svg-icon" />
        </button>
      </div>
    </div>
  </article>
</template>
