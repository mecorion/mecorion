<script setup>
import {RouterLink} from "vue-router";
import {musicPlaylists} from "@/music/catalog.js";

defineProps({
  activeSection: {type: String, required: true},
});

const emit = defineEmits(["navigate", "open-playlist"]);

const navigation = [
  {id: "home", icon: "⌂", title: "Главная", shortTitle: "Главная"},
  {id: "library", icon: "▤", title: "Моя музыка", shortTitle: "Моя"},
  {id: "local", icon: "▰", title: "Локальная музыка", shortTitle: "Локальная"},
];
</script>

<template>
  <aside class="mcrn-service-sidebar memusic-sidebar">
    <RouterLink class="mcrn-service-brand memusic-brand" to="/dashboard" aria-label="Вернуться в Mecorion">
      <span class="mcrn-service-brand__mark memusic-brand__mark">M</span>
      <span><strong>Mecorion</strong><small>Music</small></span>
    </RouterLink>

    <nav class="mcrn-service-nav memusic-navigation" aria-label="Разделы Music">
      <button
        v-for="item in navigation"
        :key="item.id"
        class="mcrn-service-nav__item memusic-navigation__item"
        :class="{
          'mcrn-service-nav__item--active': activeSection === item.id,
          'memusic-navigation__item--active': activeSection === item.id,
        }"
        type="button"
        @click="emit('navigate', item.id)"
      >
        <span class="mcrn-service-nav__icon memusic-navigation__icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="mcrn-service-nav__title memusic-navigation__title">{{ item.title }}</span>
        <span class="mcrn-service-nav__short-title memusic-navigation__short-title">{{ item.shortTitle }}</span>
      </button>
    </nav>

    <div class="mcrn-service-sidebar__section memusic-sidebar__library">
      <div class="mcrn-service-sidebar__label memusic-sidebar__label"><span>Плейлисты</span><button type="button" aria-label="Создать плейлист">＋</button></div>
      <button
        v-for="playlist in musicPlaylists"
        :key="playlist.id"
        type="button"
        @click="emit('open-playlist', playlist.id)"
      >{{ playlist.title }}</button>
    </div>

    <RouterLink class="mcrn-service-sidebar__exit memusic-sidebar__exit" to="/dashboard"><span aria-hidden="true">←</span> Все сервисы</RouterLink>
  </aside>
</template>
