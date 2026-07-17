<script setup>
import {RouterLink} from "vue-router";
import {musicPlaylists} from "@/music/catalog.js";

defineProps({
  activeSection: {type: String, required: true},
});

const emit = defineEmits(["navigate", "open-playlist"]);

const navigation = [
  {id: "home", icon: "⌂", title: "Главная", shortTitle: "Главная"},
  {id: "search", icon: "⌕", title: "Поиск", shortTitle: "Поиск"},
  {id: "library", icon: "▤", title: "Моя музыка", shortTitle: "Моя"},
  {id: "local", icon: "▰", title: "Локальная музыка", shortTitle: "Локальная"},
];
</script>

<template>
  <aside class="memusic-sidebar">
    <RouterLink class="memusic-brand" to="/dashboard" aria-label="Вернуться в Mecorion">
      <span class="memusic-brand__mark">M</span>
      <span><strong>Mecorion</strong><small>Music</small></span>
    </RouterLink>

    <nav class="memusic-navigation" aria-label="Разделы Music">
      <button
        v-for="item in navigation"
        :key="item.id"
        class="memusic-navigation__item"
        :class="{'memusic-navigation__item--active': activeSection === item.id}"
        type="button"
        @click="emit('navigate', item.id)"
      >
        <span class="memusic-navigation__icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="memusic-navigation__title">{{ item.title }}</span>
        <span class="memusic-navigation__short-title">{{ item.shortTitle }}</span>
      </button>
    </nav>

    <div class="memusic-sidebar__library">
      <div class="memusic-sidebar__label"><span>Плейлисты</span><button type="button" aria-label="Создать плейлист">＋</button></div>
      <button
        v-for="playlist in musicPlaylists"
        :key="playlist.id"
        type="button"
        @click="emit('open-playlist', playlist.id)"
      >{{ playlist.title }}</button>
    </div>

    <RouterLink class="memusic-sidebar__exit" to="/dashboard"><span aria-hidden="true">←</span> Все сервисы</RouterLink>
  </aside>
</template>
