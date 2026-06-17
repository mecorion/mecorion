<script setup>
import {nextTick, onMounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useRequestsStore} from "@/stores/requests.js";
import {dateConverting} from "../utils/converting.js";
import {openVideo} from "@/utils/helpers.js";
import HorizontalVideoCard from "@/components/HorizontalVideoCard.vue";
import LoadingUI from "@/components/LoadingUI.vue";

const route = useRoute();
const requests = useRequestsStore();

const currentVideo = ref(null);
const isLoading = ref(true);

const activeNames = ref(['1'])
const handleChange = (val) => {
  console.log(val)
}

watch(currentVideo, (newVideo) => {
  if (!newVideo || !requests.content?.length) return;
}, {immediate: false});

onMounted(async () => {
  const videoId = route.query.video_id;
  if (!videoId) {
    return;
  }

  try {
    const video = await requests.getItem(videoId);
    currentVideo.value = video;

    setTimeout(() => {
      isLoading.value = false;
    }, 2000)
  } catch (e) {
    console.error("Не удалось загрузить видео", e);
  }
});
</script>

<template>
  <LoadingUI v-if="isLoading" />
  <section class="player-page">
    <main v-if="currentVideo">
      <div>
        <div class="video-player">
          <vue-plyr>
            <video playsinline controls>
              <source :src="currentVideo.url" type="video/mp4"/>
            </video>
          </vue-plyr>
        </div>
        <div class="video-meta">
          <header>
            <h1 class="video-meta__title">{{ currentVideo.title }}</h1>
            <p class="video-meta__author">{{ currentVideo.author }}</p>
          </header>
          <div class="video-meta__description">
            <small class="video-meta__date-create">Дата загрузки: {{ dateConverting(currentVideo.date_create) }}</small>
            <span>{{ currentVideo.description || 'Описание отсутствует' }}</span>
          </div>
        </div>
      </div>
      <div class="control">
        <header>
          <h2>Эпизоды</h2>
        </header>
        <main>
          <el-collapse v-model="activeNames" @change="handleChange">
            <el-collapse-item title="1 сезон" name="1">
              <div class="serials__list">
                <el-button v-for="item in 4">
                  Серия
                </el-button>
              </div>
            </el-collapse-item>
            <el-collapse-item title="2 сезон" name="2">
              <div class="serials__list">
                <el-button v-for="item in 4">
                  Серия
                </el-button>
              </div>
            </el-collapse-item>
            <el-collapse-item title="3 сезон" name="3">
              <div class="serials__list">
                <el-button v-for="item in 4">
                  Серия
                </el-button>
              </div>
            </el-collapse-item>
            <el-collapse-item title="4 сезон" name="4">
              <div class="serials__list">
                <el-button v-for="item in 4">
                  Серия
                </el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </main>
      </div>
    </main>
  </section>
</template>