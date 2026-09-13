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
  <div v-if="overlay" class="mobile-overlay-backdrop" @click.self="overlay = false">
    <aside class="mobile-overlay" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
    <header class="mobile-overlay__header">
      <h1 id="mobile-menu-title">Меню</h1>
      <button class="legacy-button" type="button" aria-label="Закрыть меню" @click="overlay = false">×</button>
    </header>
    <nav class="sidebar-nav">
      <ul class="legacy-menu">
        <!-- Главная -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/home" class="nav-link__item">
            <HomeIcon class="svg-icon"/>
            <span>Рекомендации</span>
          </RouterLink>
        </li>

        <!-- Видео -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/videos" class="nav-link__item">
            <VideosIcon class="svg-icon"/>
            <span>Видео</span>
          </RouterLink>
        </li>

        <!-- Аниме -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/animes" class="nav-link__item">
            <AnimeIcon class="svg-icon"/>
            <span>Аниме</span>
          </RouterLink>
        </li>

        <!-- Фильмы -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/movies" class="nav-link__item">
            <FilmsIcon class="svg-icon"/>
            <span>Фильмы</span>
          </RouterLink>
        </li>

        <!-- Сериалы -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/serials" class="nav-link__item">
            <SerialsIcon class="svg-icon"/>
            <span>Сериалы</span>
          </RouterLink>
        </li>

        <!-- Мультфильмы -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/cartoons" class="nav-link__item">
            <MultfilmsIcon class="svg-icon"/>
            <span>Мультфильмы</span>
          </RouterLink>
        </li>

        <!-- Мультсериалы -->
        <li class="nav-link">
          <RouterLink @click="overlay = false" to="/videos/cartoonserials" class="nav-link__item">
            <MultserialsIcon class="svg-icon"/>
            <span>Мультсериалы</span>
          </RouterLink>
        </li>

        <li class="nav-link">
          <div @click="app.toggleTheme()" class="nav-link__item">
            <MoonIcon class="svg-icon" v-if="app.themeIcon === 'moon'" />
            <SunIcon class="svg-icon" v-else />
            <span>Сменить тему</span>
          </div>
        </li>

        <li class="nav-link">
          <div @click="app.methodLogout" class="nav-link__item">
            <ExitIcon class="svg-icon"/>
            <span>Выйти</span>
          </div>
        </li>
      </ul>
    </nav>
    </aside>
  </div>
</template>
