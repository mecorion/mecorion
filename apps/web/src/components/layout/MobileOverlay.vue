<script setup>
import {computed} from "vue";
import HomeIcon from "@/assets/icons/home.svg";
import MultfilmsIcon from "@/assets/icons/sidebar/multfilms.svg";
import FilmsIcon from "@/assets/icons/sidebar/films.svg";
import {RouterLink} from "vue-router";
import AnimeIcon from "@/assets/icons/sidebar/anime.svg";
import SerialsIcon from "@/assets/icons/sidebar/serials.svg";
import VideosIcon from "@/assets/icons/sidebar/videos.svg";
import MultserialsIcon from "@/assets/icons/sidebar/multserials.svg";
import router from "@/router/index.js";
import {useAppStore} from "@/stores/app.js";
import SunIcon from "@/assets/icons/sun.svg";
import MoonIcon from "@/assets/icons/moon.svg";
import ExitIcon from "@/assets/icons/exit.svg";

const app = useAppStore()

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:open']);

// отслеживание состояния оверлея
const overlay = computed({
  get() {
    return props.open;
  },
  set(value) {
    emit('update:open', value);
  }
});
</script>

<template>
  <el-drawer
      v-model="overlay"
      class="mobile-overlay"
      title="Меню"
      direction="btt"
      size="80%"
  >
    <h1>Меню</h1>
    <nav class="sidebar-nav">
      <el-menu>
        <!-- Главная -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/home" class="nav-link__item">
            <HomeIcon class="svg-icon"/>
            <span>Рекомендации</span>
          </RouterLink>
        </el-menu-item>

        <!-- Видео -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/videos" class="nav-link__item">
            <VideosIcon class="svg-icon"/>
            <span>Видео</span>
          </RouterLink>
        </el-menu-item>

        <!-- Аниме -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/animes" class="nav-link__item">
            <AnimeIcon class="svg-icon"/>
            <span>Аниме</span>
          </RouterLink>
        </el-menu-item>

        <!-- Фильмы -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/movies" class="nav-link__item">
            <FilmsIcon class="svg-icon"/>
            <span>Фильмы</span>
          </RouterLink>
        </el-menu-item>

        <!-- Сериалы -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/serials" class="nav-link__item">
            <SerialsIcon class="svg-icon"/>
            <span>Сериалы</span>
          </RouterLink>
        </el-menu-item>

        <!-- Мультфильмы -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/cartoons" class="nav-link__item">
            <MultfilmsIcon class="svg-icon"/>
            <span>Мультфильмы</span>
          </RouterLink>
        </el-menu-item>

        <!-- Мультсериалы -->
        <el-menu-item class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/cartoonserials" class="nav-link__item">
            <MultserialsIcon class="svg-icon"/>
            <span>Мультсериалы</span>
          </RouterLink>
        </el-menu-item>

        <el-menu-item class="nav-link">
          <div @click="app.toggleTheme()" class="nav-link__item">
            <MoonIcon class="svg-icon" v-if="app.themeIcon === 'moon'" />
            <SunIcon class="svg-icon" v-else />
            <span>Сменить тему</span>
          </div>
        </el-menu-item>

        <el-menu-item class="nav-link">
          <div @click="app.methodLogout" class="nav-link__item">
            <ExitIcon class="svg-icon"/>
            <span>Выйти</span>
          </div>
        </el-menu-item>
      </el-menu>
    </nav>
  </el-drawer>
</template>