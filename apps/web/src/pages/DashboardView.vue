<script setup>
import {RouterLink} from "vue-router";
import musicArt from "@/assets/illustrations/dashboard/music-bars.svg";
import videoArt from "@/assets/illustrations/dashboard/video-wave.svg";
import booksArt from "@/assets/illustrations/dashboard/books.svg";
import lifeArt from "@/assets/illustrations/dashboard/life.svg";
import cloudArt from "@/assets/illustrations/dashboard/cloud.svg";
import sentinelArt from "@/assets/illustrations/dashboard/sentinel.svg";

const services = [
  {
    id: "music",
    title: "Музыка",
    subtitle: "Личная коллекция, поиск и простой плеер для локальных треков.",
    icon: "♪",
    route: "/music",
    state: "Готово",
    tone: "rose",
    art: musicArt,
    recommended: true,
  },
  {
    id: "video",
    title: "Видео",
    subtitle: "Ваш медиаплеер для фильмов и видео.",
    icon: "▶",
    route: "/home",
    state: "Готово",
    tone: "cyan",
    art: videoArt,
  },
  {
    id: "books",
    title: "Книги",
    subtitle: "Полка, заметки и чтение без отвлечений.",
    icon: "Aa",
    state: "Скоро",
    tone: "violet",
    art: booksArt,
  },
  {
    id: "life",
    title: "Mecorion Life",
    subtitle: "Заметки, цели и трекер повседневных привычек.",
    icon: "⌁",
    state: "Скоро",
    tone: "rose",
    art: lifeArt,
  },
  {
    id: "cloud",
    title: "Cloud",
    subtitle: "Ваши файлы, безопасно и всегда под рукой.",
    icon: "☁",
    state: "Скоро",
    tone: "cyan",
    art: cloudArt,
  },
  {
    id: "sentinel",
    title: "Sentinel / Admin",
    subtitle: "Панель администрирования и инструменты контроля системы.",
    icon: "◇",
    state: "Скоро",
    tone: "violet",
    art: sentinelArt,
  },
];
</script>

<template>
  <div class="mecorion-workspace dashboard-view">
    <header class="workspace-topbar">
      <RouterLink class="workspace-brand" to="/dashboard" aria-label="Mecorion dashboard">
        <span class="workspace-brand__mark">M</span>
        <span>Mecorion</span>
      </RouterLink>

      <div class="workspace-topbar__actions">
        <button class="topbar-icon" type="button" aria-label="Уведомления">
          <span aria-hidden="true">◌</span>
          <i></i>
        </button>
        <button class="account-chip" type="button">
          <span class="account-chip__avatar">ВД</span>
          <span class="account-chip__name">Вадим</span>
        </button>
      </div>
    </header>

    <main class="dashboard-canvas">
      <section class="dashboard-overview">
        <div class="dashboard-intro">
          <p class="workspace-eyebrow">Ваше пространство</p>
          <h1>Добрый вечер, Вадим.</h1>
          <p>Mecorion - ваша личная экосистема сервисов.</p>
        </div>

        <aside class="dashboard-health" aria-label="Статус системы">
          <span class="dashboard-health__indicator" aria-hidden="true"></span>
          <div><strong>Система в порядке</strong><small>Все сервисы работают стабильно</small></div>
          <span class="dashboard-health__pulse" aria-hidden="true">〽</span>
        </aside>
      </section>

      <section class="dashboard-services" aria-label="Сервисы Mecorion">
        <component
          :is="service.route ? RouterLink : 'article'"
          v-for="service in services"
          :key="service.id"
          :to="service.route"
          class="service-card"
          :class="[
            `service-card--${service.tone}`,
            {'service-card--ready': service.state === 'Готово', 'service-card--soon': service.state === 'Скоро', 'service-card--featured': service.recommended}
          ]"
        >
          <div class="service-card__header">
            <span class="service-icon" :class="`service-icon--${service.tone}`">{{ service.icon }}</span>
            <span class="service-status" :class="{'service-status--ready': service.state === 'Готово'}">{{ service.state }}</span>
          </div>
          <div class="service-card__copy">
            <h2>{{ service.title }}</h2>
            <p>{{ service.subtitle }}</p>
          </div>
          <span v-if="service.recommended" class="service-card__recommendation">Рекомендуем</span>
          <img class="service-card__art" :src="service.art" alt="" aria-hidden="true" />
          <span v-if="service.route" class="service-card__action" aria-hidden="true">↗</span>
        </component>
      </section>

      <section class="dashboard-notes" aria-label="О Mecorion">
        <span class="dashboard-notes__mark" aria-hidden="true">✦</span>
        <div><strong>Единая экосистема. Полный контроль.</strong><p>Сервисы Mecorion работают вместе, чтобы вы могли сосредоточиться на главном.</p></div>
        <button class="mc-button mc-button--ghost mc-button--sm" type="button">Узнать больше <span aria-hidden="true">→</span></button>
      </section>
    </main>
  </div>
</template>
