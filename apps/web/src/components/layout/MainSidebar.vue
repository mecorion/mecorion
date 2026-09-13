<script setup>
import {RouterLink, useRoute} from "vue-router";
import {onBeforeUnmount, onMounted, ref} from "vue";
import BurgerMenu from '../../assets/icons/burger-menu.svg'
import HomeIcon from '../../assets/icons/home.svg'
import VideosIcon from '../../assets/icons/sidebar/videos.svg'
import AnimeIcon from '../../assets/icons/sidebar/anime.svg'
import FilmsIcon from '../../assets/icons/sidebar/films.svg'
import MultserialsIcon from '../../assets/icons/sidebar/multserials.svg'
import MultfilmsIcon from '../../assets/icons/sidebar/multfilms.svg'
import SerialsIcon from '../../assets/icons/sidebar/serials.svg'
import router from "@/router/index.js";

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
        <button class="legacy-button" type="button" aria-label="Переключить боковое меню" @click="toggleHideSidebar">
          <BurgerMenu class="svg-icon"/>
        </button>
        <div :class="route.path === '/' || route.path === '/home' ? '' : 'back'" @click.prevent="pushToMainPage" v-if="sidebarVisible">
          <h3 class="text-2xl uppercase">Mecorion</h3>
          <small class="text-sm font-light">Видео</small>
        </div>
      </header>

      <nav class="sidebar-nav">
        <ul class="legacy-menu">

          <!-- Главная -->
          <li class="nav-link">
            <RouterLink to="/home" class="nav-link__item">
              <HomeIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Рекомендации</span>
            </RouterLink>
          </li>

          <!-- Видео -->
          <li class="nav-link">
            <RouterLink to="/videos/videos" class="nav-link__item">
              <VideosIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Видео</span>
            </RouterLink>
          </li>

          <!-- Аниме -->
          <li class="nav-link">
            <RouterLink to="/videos/animes" class="nav-link__item">
              <AnimeIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Аниме</span>
            </RouterLink>
          </li>

          <!-- Фильмы -->
          <li class="nav-link">
            <RouterLink to="/videos/movies" class="nav-link__item">
              <FilmsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Фильмы</span>
            </RouterLink>
          </li>

          <!-- Сериалы -->
          <li class="nav-link">
            <RouterLink to="/videos/serials" class="nav-link__item">
              <SerialsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Сериалы</span>
            </RouterLink>
          </li>

          <!-- Мультфильмы -->
          <li class="nav-link">
            <RouterLink to="/videos/cartoons" class="nav-link__item">
              <MultfilmsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Мультфильмы</span>
            </RouterLink>
          </li>

          <!-- Мультсериалы -->
          <li class="nav-link">
            <RouterLink to="/videos/cartoonserials" class="nav-link__item">
              <MultserialsIcon class="svg-icon"/>
              <span v-if="sidebarVisible">Мультсериалы</span>
            </RouterLink>
          </li>

          <!-- UI Kit -->
          <li class="nav-link">
            <RouterLink to="/ui-kit" class="nav-link__item">
              <HomeIcon class="svg-icon"/>
              <span v-if="sidebarVisible">UI Kit</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
