<script setup>
import {computed} from "vue";
import {RouterLink} from "vue-router";
import musicArt from "@/assets/illustrations/dashboard/music-bars.svg";
import videoArt from "@/assets/illustrations/dashboard/video-wave.svg";
import booksArt from "@/assets/illustrations/dashboard/books.svg";
import cloudArt from "@/assets/illustrations/dashboard/cloud.svg";
import sentinelArt from "@/assets/illustrations/dashboard/sentinel.svg";

const currentUser = {
  name: "Вадим",
  initials: "ВД",
  id: "7A3F9C",
  role: "base",
  plan: "Free",
  profileProgress: 40,
};

const roleLabels = {
  base: "Базовый",
  agent: "Агент",
  moderator: "Модератор",
  keeper: "Хранитель",
  admin: "Администратор",
};

// Dashboard собирается из конфигурации роли. Позже эти данные можно заменить
// ответом API, не переписывая верстку всего экрана.
const dashboardByRole = {
  base: {
    welcomeTitle: `Добро пожаловать, ${currentUser.name}!`,
    welcomeText: "Это ваше персональное пространство в Mecorion. Здесь всё, что нужно для работы, учёбы, развлечений и общения — в одном месте.",
    services: [
      {id: "music", title: "Music", description: "Музыка без ограничений", icon: "♫", route: "/music", art: musicArt, tone: "rose"},
      {id: "video", title: "Video", description: "Фильмы, шоу и трансляции", icon: "▷", route: "/home", art: videoArt, tone: "cyan"},
      {id: "books", title: "Books", description: "Книги и аудио в одном месте", icon: "▥", route: null, art: booksArt, tone: "violet"},
      {id: "drive", title: "Drive", description: "Ваши файлы в безопасности", icon: "☁", route: null, art: cloudArt, tone: "blue"},
      {id: "vpn", title: "VPN", description: "Приватность без границ", icon: "◇", route: null, art: sentinelArt, tone: "green"},
      {id: "spaces", title: "Spaces", description: "Создавайте пространства", icon: "⬡", route: null, art: sentinelArt, tone: "rose"},
    ],
    steps: [
      {id: "email", number: 1, title: "Подтвердить email", text: "Подтвердите почту, чтобы защитить аккаунт.", action: "Подтвердить", icon: "✉"},
      {id: "interests", number: 2, title: "Выбрать интересы", text: "Мы подберём контент и рекомендации для вас.", action: "Выбрать", icon: "♡"},
      {id: "space", number: 3, title: "Создать пространство", text: "Организуйте работу, учёбу или личные проекты.", action: "Создать", icon: "⬡"},
      {id: "profile", number: 4, title: "Настроить профиль", text: "Добавьте аватар и немного о себе.", action: "Настроить", icon: "♙"},
    ],
  },
};

const dashboard = computed(() => dashboardByRole[currentUser.role] ?? dashboardByRole.base);

const primaryNavigation = [
  {title: "Домой", icon: "⌂", active: true},
  {title: "Исследовать", icon: "⌕"},
  {title: "Сервисы", icon: "▦"},
  {title: "Сохранённое", icon: "▯"},
  {title: "Загрузки", icon: "⇩"},
];

const serviceNavigation = [
  {title: "Music", icon: "♫", route: "/music"},
  {title: "Video", icon: "▻", route: "/home"},
  {title: "Books", icon: "▥"},
  {title: "Drive", icon: "☁"},
  {title: "VPN", icon: "◇"},
  {title: "Agents", icon: "☷"},
];

const communityNavigation = [
  {title: "Resolutions", icon: "⚑"},
  {title: "Requests", icon: "▤"},
];

const accountNavigation = [
  {title: "Профиль", icon: "♙", route: "/profile"},
  {title: "Настройки", icon: "⚙"},
];

const trendingItems = [
  {title: "Dune", type: "Фильм", tone: "orange"},
  {title: "House of the Dragon", type: "Сериал", tone: "gold"},
  {title: "Hurry Up Tomorrow", type: "Альбом", tone: "dark"},
  {title: "Sapiens", type: "Книга", tone: "paper"},
];

const activity = [
  {label: "Сессии", value: "3", icon: "↯"},
  {label: "Проведено времени", value: "2 ч 18 м", icon: "◷"},
  {label: "Загружено файлов", value: "0", icon: "⇩"},
  {label: "Просмотрено видео", value: "0", icon: "◉"},
];
</script>

<template>
  <div class="mecorion-workspace dashboard-shell">
    <aside class="dashboard-sidebar" aria-label="Навигация Mecorion">
      <RouterLink class="workspace-brand dashboard-sidebar__brand" to="/dashboard" aria-label="Mecorion dashboard">
        <span class="workspace-brand__mark">M</span>
        <span>Mecorion</span>
      </RouterLink>

      <nav class="dashboard-nav" aria-label="Основное меню">
        <component
          :is="item.route ? RouterLink : 'button'"
          v-for="item in primaryNavigation"
          :key="item.title"
          :to="item.route"
          type="button"
          class="dashboard-nav__item"
          :class="{'dashboard-nav__item--active': item.active}"
        >
          <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
        </component>
      </nav>

      <div class="dashboard-nav-group">
        <p>Сервисы</p>
        <component
          :is="item.route ? RouterLink : 'button'"
          v-for="item in serviceNavigation"
          :key="item.title"
          :to="item.route"
          type="button"
          class="dashboard-nav__item"
        >
          <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
        </component>
      </div>

      <div class="dashboard-nav-group">
        <p>Сообщество</p>
        <button v-for="item in communityNavigation" :key="item.title" class="dashboard-nav__item" type="button">
          <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
        </button>
      </div>

      <div class="dashboard-nav-group">
        <p>Аккаунт</p>
        <component
          :is="item.route ? RouterLink : 'button'"
          v-for="item in accountNavigation"
          :key="item.title"
          :to="item.route"
          class="dashboard-nav__item"
          type="button"
        >
          <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
        </component>
      </div>

      <button class="dashboard-sidebar__support" type="button"><span aria-hidden="true">?</span> Помощь и поддержка</button>
    </aside>

    <section class="dashboard-board">
      <header class="dashboard-topbar">
        <label class="dashboard-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Поиск по Mecorion" />
        </label>
        <div class="dashboard-topbar__account">
          <button class="dashboard-icon-button dashboard-icon-button--notice" type="button" aria-label="Уведомления"><span>♧</span><i>3</i></button>
          <button class="dashboard-icon-button" type="button" aria-label="Синхронизация"><span>◌</span></button>
          <RouterLink class="dashboard-user-chip" to="/profile">
            <span>{{ currentUser.initials }}</span>
            <strong>{{ currentUser.name }}</strong>
            <small>Mecorion ID: {{ currentUser.id }}</small>
          </RouterLink>
        </div>
      </header>

      <main class="dashboard-content">
        <section class="dashboard-main-column">
          <article class="dashboard-hero">
            <div class="dashboard-hero__copy">
              <p class="workspace-eyebrow">Добро пожаловать</p>
              <h1>{{ dashboard.welcomeTitle }}</h1>
              <p>{{ dashboard.welcomeText }}</p>
            </div>
            <div class="dashboard-profile-progress" aria-label="Настройка профиля">
              <button type="button" aria-label="Скрыть">×</button>
              <p>Настройка профиля</p>
              <strong>{{ currentUser.profileProgress }}%</strong>
              <span><i :style="{width: `${currentUser.profileProgress}%`}"></i></span>
              <small>Заполните профиль и откройте больше возможностей.</small>
              <button class="dashboard-primary-action" type="button">Продолжить настройку <span>›</span></button>
            </div>
          </article>

          <section class="dashboard-section">
            <h2>Быстрый доступ к сервисам</h2>
            <div class="dashboard-service-grid">
              <component
                :is="service.route ? RouterLink : 'article'"
                v-for="service in dashboard.services"
                :key="service.id"
                :to="service.route"
                class="dashboard-service-tile"
                :class="`dashboard-service-tile--${service.tone}`"
              >
                <span class="dashboard-service-tile__icon">{{ service.icon }}</span>
                <strong>{{ service.title }}</strong>
                <p>{{ service.description }}</p>
                <img :src="service.art" alt="" aria-hidden="true" />
                <span class="dashboard-arrow" aria-hidden="true">→</span>
              </component>
            </div>
          </section>

          <section class="dashboard-section">
            <h2>Начните с главного</h2>
            <div class="dashboard-step-grid">
              <article v-for="step in dashboard.steps" :key="step.id" class="dashboard-step-card">
                <span class="dashboard-step-card__number">{{ step.number }}</span>
                <span class="dashboard-step-card__icon" aria-hidden="true">{{ step.icon }}</span>
                <div>
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.text }}</p>
                  <button type="button">{{ step.action }}</button>
                </div>
              </article>
            </div>
          </section>

          <section class="dashboard-section dashboard-section--inline">
            <h2>Популярное сейчас</h2>
            <button type="button">Смотреть всё</button>
            <div class="dashboard-trending">
              <article v-for="item in trendingItems" :key="item.title" class="dashboard-trending-card" :class="`dashboard-trending-card--${item.tone}`">
                <span>{{ item.type }}</span>
                <strong>{{ item.title }}</strong>
              </article>
            </div>
          </section>

          <section class="dashboard-premium-strip">
            <span aria-hidden="true">△</span>
            <div>
              <strong>Раскройте все возможности Mecorion</strong>
              <p>Перейдите на <b>Premium</b> и получите максимум свободы и инструментов.</p>
            </div>
            <button type="button">Перейти на Premium</button>
          </section>
        </section>

        <aside class="dashboard-side-column" aria-label="Сводка аккаунта">
          <section class="dashboard-widget dashboard-profile-card">
            <h2>Мой профиль</h2>
            <div class="dashboard-profile-card__user">
              <span>{{ currentUser.initials }}</span>
              <div>
                <strong>{{ currentUser.name }} <em>{{ currentUser.plan }}</em></strong>
                <small>Mecorion ID: {{ currentUser.id }}</small>
              </div>
            </div>
            <div class="dashboard-profile-card__status">
              <small>Статус аккаунта</small>
              <strong>{{ roleLabels[currentUser.role] }}</strong>
              <button type="button">Сравнить планы →</button>
            </div>
          </section>

          <section class="dashboard-widget">
            <div class="dashboard-widget__header">
              <h2>Активность</h2>
              <span>За 7 дней</span>
            </div>
            <ul class="dashboard-activity-list">
              <li v-for="item in activity" :key="item.label"><span>{{ item.icon }}</span>{{ item.label }}<strong>{{ item.value }}</strong></li>
            </ul>
            <button class="dashboard-widget__link" type="button">Смотреть всё →</button>
          </section>

          <section class="dashboard-widget dashboard-security-card">
            <h2>Безопасность</h2>
            <div>
              <span aria-hidden="true">◇</span>
              <strong>Ваш аккаунт защищён</strong>
              <small>Рекомендации выполнены</small>
            </div>
            <button type="button">Включите двухфакторную аутентификацию <span>›</span></button>
            <a href="#">Открыть настройки →</a>
          </section>

          <section class="dashboard-widget dashboard-premium-card">
            <span aria-hidden="true">◇</span>
            <h2>Mecorion Premium</h2>
            <p>Больше возможностей, никаких ограничений.</p>
            <button type="button">Узнать больше</button>
          </section>
        </aside>
      </main>
    </section>
  </div>
</template>
