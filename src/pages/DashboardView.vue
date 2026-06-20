<script setup>
import {computed} from "vue";
import {RouterLink} from "vue-router";

const services = [
  {
    id: "music",
    title: "Музыка",
    subtitle: "Личная медиатека",
    icon: "♪",
    route: "/music",
    state: "Готово к запуску",
    tone: "rose",
  },
  {
    id: "books",
    title: "Книги",
    subtitle: "Полка и заметки",
    icon: "Aa",
    state: "Скоро",
    tone: "violet",
  },
  {
    id: "video",
    title: "Видео",
    subtitle: "Смотреть позже",
    icon: "▶",
    route: "/home",
    state: "Библиотека",
    tone: "cyan",
  },
];

const activeServices = computed(() => services.filter((service) => service.route));
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
      <section class="dashboard-intro">
        <p class="workspace-eyebrow">Ваше пространство</p>
        <h1>Добрый вечер, Вадим.</h1>
        <p>Сервисы Mecorion живут отдельно, но остаются в одном личном контуре.</p>
      </section>

      <section class="dashboard-flow" aria-label="Сервисы Mecorion">
        <div class="dashboard-flow__rail" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>

        <article class="dashboard-focus">
          <div class="dashboard-focus__topline">
            <span class="workspace-eyebrow">Следующий сервис</span>
            <span class="service-status service-status--ready">Готов</span>
          </div>
          <div class="music-signal" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="dashboard-focus__content">
            <div>
              <span class="service-icon service-icon--rose">♪</span>
              <h2>Музыка</h2>
              <p>Личная коллекция, поиск и простой плеер для локальных треков.</p>
            </div>
            <RouterLink class="mc-button mc-button--primary dashboard-focus__button" to="/music">
              Открыть музыку <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </article>

        <aside class="dashboard-pulse">
          <p class="workspace-eyebrow">Сейчас в контуре</p>
          <div class="dashboard-pulse__metric"><strong>03</strong><span>сервиса</span></div>
          <p>Единый аккаунт и независимые интерфейсы для каждой задачи.</p>
          <div class="dashboard-pulse__line" aria-hidden="true"><span></span></div>
        </aside>

        <div class="dashboard-services">
          <RouterLink
            v-for="service in activeServices"
            :key="service.id"
            :to="service.route"
            class="service-tile"
            :class="`service-tile--${service.tone}`"
          >
            <span class="service-icon" :class="`service-icon--${service.tone}`">{{ service.icon }}</span>
            <span class="service-tile__copy">
              <strong>{{ service.title }}</strong>
              <small>{{ service.subtitle }}</small>
            </span>
            <span class="service-tile__action" aria-hidden="true">↗</span>
          </RouterLink>

          <div
            v-for="service in services.filter((item) => !item.route)"
            :key="service.id"
            class="service-tile service-tile--locked"
          >
            <span class="service-icon" :class="`service-icon--${service.tone}`">{{ service.icon }}</span>
            <span class="service-tile__copy">
              <strong>{{ service.title }}</strong>
              <small>{{ service.subtitle }}</small>
            </span>
            <span class="service-status">{{ service.state }}</span>
          </div>
        </div>
      </section>

      <section class="dashboard-notes">
        <div>
          <p class="workspace-eyebrow">Система</p>
          <h2>Единый профиль для всех сервисов</h2>
        </div>
        <p>Настройки, уведомления и доступы будут собраны здесь, без смешения с интерфейсами приложений.</p>
      </section>
    </main>
  </div>
</template>
