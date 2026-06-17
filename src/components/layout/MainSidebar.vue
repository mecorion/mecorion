<script setup>
import {RouterLink, useRoute} from "vue-router";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import BurgerMenu from '../../assets/icons/burger-menu.svg'
import HomeIcon from '../../assets/icons/home.svg'
import VideosIcon from '../../assets/icons/sidebar/videos.svg'
import AnimeIcon from '../../assets/icons/sidebar/anime.svg'
import FilmsIcon from '../../assets/icons/sidebar/films.svg'
import MultserialsIcon from '../../assets/icons/sidebar/multserials.svg'
import MultfilmsIcon from '../../assets/icons/sidebar/multfilms.svg'
import SerialsIcon from '../../assets/icons/sidebar/serials.svg'
import router from "@/router/index.js";
import {ElMessage} from "element-plus";

const route = useRoute()
const width = ref(window.innerWidth);
const MAX_WIDTH = 1170;
const sidebarVisible = ref(false);

// функция для автоматического скрытия сайдбара при 1170px ширины
function updateWidth() {
  width.value = window.innerWidth;

  sidebarVisible.value = width.value <= MAX_WIDTH ? false : true;
}

const toggleHideSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
}

const pushToMainPage = async () => {
  if (route.path === '/' || route.path === '/home') {
    ElMessage({
      message: 'Вы уже на главной странице!',
      type: 'primary',
      duration: 2000
    })
    return
  }

  await router.push('/')
}

onMounted(() => {
  updateWidth()
  window.addEventListener('resize', updateWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth);
});
</script>

<template>
  <aside class="sidebar" :class="sidebarVisible ? '' : 'collapsed'">
    <div class="sidebar__inner">
      <header>
        <el-button @click="toggleHideSidebar">
          <BurgerMenu class="svg-icon"/>
        </el-button>
        <div :class="route.path === '/' || route.path === '/home' ? '' : 'back'" @click.prevent="pushToMainPage" v-if="sidebarVisible">
          <h3 class="text-2xl uppercase">Mecorion</h3>
          <small class="text-sm font-light">Видео</small>
        </div>
      </header>

      <nav class="sidebar-nav">
        <el-menu>

          <!-- Главная -->
          <el-menu-item class="nav-link">
            <RouterLink to="/home" class="nav-link__item">
              <HomeIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Рекомендации</span>
            </RouterLink>
          </el-menu-item>

          <!-- Видео -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/videos" class="nav-link__item">
              <VideosIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Видео</span>
            </RouterLink>
          </el-menu-item>

          <!-- Аниме -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/animes" class="nav-link__item">
              <AnimeIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Аниме</span>
            </RouterLink>
          </el-menu-item>

          <!-- Фильмы -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/movies" class="nav-link__item">
              <FilmsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Фильмы</span>
            </RouterLink>
          </el-menu-item>

          <!-- Сериалы -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/serials" class="nav-link__item">
              <SerialsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Сериалы</span>
            </RouterLink>
          </el-menu-item>

          <!-- Мультфильмы -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/cartoons" class="nav-link__item">
              <MultfilmsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Мультфильмы</span>
            </RouterLink>
          </el-menu-item>

          <!-- Мультсериалы -->
          <el-menu-item class="nav-link">
            <RouterLink to="/videos/cartoonserials" class="nav-link__item">
              <MultserialsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Мультсериалы</span>
            </RouterLink>
          </el-menu-item>
        </el-menu>
      </nav>
    </div>
  </aside>
</template>