<script setup>
import UserProfile from "../UserProfile.vue";
import {onBeforeUnmount, onMounted, ref} from "vue";
import SearchIcon from '../../assets/icons/searchGlass.svg'
import ExitIcon from '../../assets/icons/exit.svg'
import {useAppStore} from "@/stores/app.js";
import SunIcon from '../../assets/icons/sun.svg'
import MoonIcon from '../../assets/icons/moon.svg'
import MobileOverlay from "@/components/layout/MobileOverlay.vue";

const searchQuery = ref('')
const app = useAppStore()
const width = ref(window.innerWidth);
const MAX_WIDTH = 768;
const menuType = ref(false);
const isOverlayOpen = ref(false)

// метод открытия оверлея
const openOverlay = () => {
  isOverlayOpen.value = true;
};

// функция расчёта ширины
function updateWidth() {
  width.value = window.innerWidth;
  menuType.value = width.value <= MAX_WIDTH;
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
  <header class="main-header">
    <!-- Search -->
    <search class="h-full">
      <label class="legacy-search">
        <SearchIcon class="svg-icon"/>
        <input v-model="searchQuery" type="search" placeholder="Поиск..." aria-label="Поиск" />
      </label>
    </search>

    <img
        class="user-avatar__button"
        v-if="menuType"
        src="@/assets/images/avatar-placeholder.jpeg"
        alt="user"
        @click="openOverlay"
    />

    <!-- User Profile -->
    <details v-else class="legacy-dropdown h-full">
      <summary><UserProfile/></summary>
      <div class="header-menu">
          <button type="button" @click="app.toggleTheme()" class="header-menu__item">
            <MoonIcon class="svg-icon" v-if="app.themeIcon === 'moon'" />
            <SunIcon class="svg-icon" v-else />
            <span>Сменить тему</span>
          </button>

          <button type="button" @click="app.methodLogout" class="header-menu__item">
            <ExitIcon class="svg-icon"/>
            <span>Выйти</span>
          </button>
      </div>
    </details>
  </header>

  <MobileOverlay
    v-model:open="isOverlayOpen"
  />
</template>
