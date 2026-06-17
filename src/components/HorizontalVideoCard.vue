<script setup>
defineProps({
  video: Object
});
</script>

<template>
  <div class="video-card--horizontal">
    <div class="horizontal">
      <img :src="video.thumbnail" alt="Обложка видео"/>
      <div class="video-card__info">
        <h3>{{ video.title }}</h3>
        <p>{{ video.author }}</p>
      </div>
    </div>
  </div>
</template>