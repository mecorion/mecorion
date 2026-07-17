<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from "vue";
import {useRoute, useRouter} from "vue-router";
import VideoCard from "../components/VideoCard.vue";
import {useRequestsStore} from "@/stores/requests.js";
import {openVideo} from "@/utils/helpers.js";
import HorizontalVideoCard from "@/components/HorizontalVideoCard.vue";
import VideoPlayer from "../components/VideoPlayer.vue";

const route = useRoute();
const requests = useRequestsStore()

const category = computed(() => route.params.category);

const categoryName = computed(() => {
  switch (category.value) {
    case "videos":
      return "Видео";
    case "animes":
      return "Аниме";
    case "movies":
      return "Фильмы";
    case "serials":
      return "Сериалы";
    case "cartoons":
      return "Мультфильмы";
    case "cartoonserials":
      return "Мультсериалы";
    default:
      return "Видео";
  }
});

const filteredVideos = computed(() => {
  const cat = category.value;
  const dataObj = requests.content[0] || {};
  return dataObj[cat] || [];
});
</script>

<template>
  <div>
    <h1 class="section__title">{{ categoryName }}</h1>

    <el-empty v-if="filteredVideos.length === 0" description="Здесь пусто" />
    <div v-else class="video-page">
      <VideoCard
          v-for="item in filteredVideos"
          :key="item.id"
          @click="openVideo(item)"
          :video="item"
      />
      <VideoPlayer
        src=""
        preview=""
        title=""
      />
    </div>
  </div>
</template>