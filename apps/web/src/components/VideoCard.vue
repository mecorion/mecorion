<script setup>
import PlayIcon from '../assets/icons/play.svg';

defineProps({
  video: Object
});
</script>

<template>
  <el-card class="video-card" shadow="hover">
    <img :src="video.thumbnail" alt="Обложка видео" class="w-full h-40 object-cover rounded"/>

    <div class="video-card__info">
      <h3>{{ video.title }}</h3>
      <p>{{ video.author }}</p>
    </div>

    <div class="video-card__actions">
      <el-button @click="$emit('play', video)">
        <PlayIcon class="svg-icon" />
      </el-button>
    </div>
  </el-card>
</template>