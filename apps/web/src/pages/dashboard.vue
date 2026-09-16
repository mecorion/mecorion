<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import {computed} from "vue";
import UiAvatar from "@/components/ui/UiAvatar.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiProgress from "@/components/ui/UiProgress.vue";

import musicArt from "@/assets/illustrations/dashboard/music-bars.svg";
import videoArt from "@/assets/illustrations/dashboard/video-wave.svg";
import booksArt from "@/assets/illustrations/dashboard/books.svg";
import cloudArt from "@/assets/illustrations/dashboard/cloud.svg";
import sentinelArt from "@/assets/illustrations/dashboard/sentinel.svg";

const currentUser = {
  name: "Иван",
  initials: "ИИ",
  id: "000000",
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
      {id: "video", title: "Video", description: "Фильмы, шоу и трансляции", icon: "▷", route: "/video", art: videoArt, tone: "cyan"},
      {id: "books", title: "Books", description: "Книги и аудио в одном месте", icon: "▥", route: "/books", art: booksArt, tone: "amber"},
      {id: "course", title: "Course", description: "Курсы и практика", icon: "△", route: "/course", art: booksArt, tone: "green"},
      {id: "drive", title: "Drive", description: "Ваши файлы в безопасности", icon: "☁", route: "/drive", art: cloudArt, tone: "blue"},
      {id: "vpn", title: "VPN", description: "Приватность без границ", icon: "◇", route: "/vpn", art: sentinelArt, tone: "green"},
      {id: "spaces", title: "Spaces", description: "Создавайте пространства", icon: "⬡", route: "/spaces", art: sentinelArt, tone: "rose"},
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

const trendingItems = [
  {title: "Фильм дня", type: "Фильм", tone: "orange"},
  {title: "Сериал недели", type: "Сериал", tone: "gold"},
  {title: "Новый альбом", type: "Альбом", tone: "dark"},
  {title: "Книга месяца", type: "Книга", tone: "paper"},
];

const activity = [
  {label: "Сессии", value: "3", icon: "↯"},
  {label: "Проведено времени", value: "2 ч 18 м", icon: "◷"},
  {label: "Загружено файлов", value: "0", icon: "⇩"},
  {label: "Просмотрено видео", value: "0", icon: "◉"},
];
</script>

<template>
      <main class="dashboard-content">
        <section class="dashboard-main-column">
          <UiCard raw unstyled class="dashboard-hero">
            <div class="dashboard-hero__copy">
              <p class="workspace-eyebrow">Добро пожаловать</p>
              <h1>{{ dashboard.welcomeTitle }}</h1>
              <p>{{ dashboard.welcomeText }}</p>
            </div>
            <div class="dashboard-profile-progress" aria-label="Настройка профиля">
              <UiButton unstyled type="button" aria-label="Скрыть">×</UiButton>
              <p>Настройка профиля</p>
              <strong>{{ currentUser.profileProgress }}%</strong>
              <UiProgress class="dashboard-profile-progress__bar" :value="currentUser.profileProgress" size="sm" label="Настройка профиля" />
              <small>Заполните профиль и откройте больше возможностей.</small>
              <UiButton unstyled class="dashboard-primary-action" type="button">Продолжить настройку <span>›</span></UiButton>
            </div>
          </UiCard>

          <section class="dashboard-section">
            <h2>Быстрый доступ к сервисам</h2>
            <div class="dashboard-service-grid">
              <UiCard
                v-for="service in dashboard.services"
                :key="service.id"
                :to="service.route"
                raw
                unstyled
                class="dashboard-service-tile"
                :class="`dashboard-service-tile--${service.tone}`"
              >
                <span class="dashboard-service-tile__icon">{{ service.icon }}</span>
                <strong>{{ service.title }}</strong>
                <p>{{ service.description }}</p>
                <img :src="service.art" alt="" aria-hidden="true" />
                <span class="dashboard-arrow" aria-hidden="true">→</span>
              </UiCard>
            </div>
          </section>

          <section class="dashboard-section">
            <h2>Начните с главного</h2>
            <div class="dashboard-step-grid">
              <UiCard v-for="step in dashboard.steps" :key="step.id" raw unstyled class="dashboard-step-card">
                <span class="dashboard-step-card__number">{{ step.number }}</span>
                <span class="dashboard-step-card__icon" aria-hidden="true">{{ step.icon }}</span>
                <div>
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.text }}</p>
                  <UiButton unstyled type="button">{{ step.action }}</UiButton>
                </div>
              </UiCard>
            </div>
          </section>

          <section class="dashboard-section dashboard-section--inline">
            <h2>Популярное сейчас</h2>
            <UiButton unstyled type="button">Смотреть всё</UiButton>
            <div class="dashboard-trending">
              <UiCard v-for="item in trendingItems" :key="item.title" raw unstyled class="dashboard-trending-card" :class="`dashboard-trending-card--${item.tone}`">
                <UiBadge class="dashboard-trending-card__badge">{{ item.type }}</UiBadge>
                <strong>{{ item.title }}</strong>
              </UiCard>
            </div>
          </section>

          <section class="dashboard-premium-strip">
            <span aria-hidden="true">△</span>
            <div>
              <strong>Раскройте все возможности Mecorion</strong>
              <p>Перейдите на <b>Premium</b> и получите максимум свободы и инструментов.</p>
            </div>
            <UiButton unstyled type="button">Перейти на Premium</UiButton>
          </section>
        </section>

        <aside class="dashboard-side-column" aria-label="Сводка аккаунта">
          <UiCard raw unstyled class="dashboard-widget dashboard-profile-card">
            <h2>Мой профиль</h2>
            <div class="dashboard-profile-card__user">
              <UiAvatar :fallback="currentUser.initials" size="lg" />
              <div>
                <strong>{{ currentUser.name }} <UiBadge>{{ currentUser.plan }}</UiBadge></strong>
                <small>Mecorion ID: {{ currentUser.id }}</small>
              </div>
            </div>
            <div class="dashboard-profile-card__status">
              <small>Статус аккаунта</small>
              <strong>{{ roleLabels[currentUser.role] }}</strong>
              <UiButton unstyled type="button">Сравнить планы →</UiButton>
            </div>
          </UiCard>

          <UiCard raw unstyled class="dashboard-widget">
            <div class="dashboard-widget__header">
              <h2>Активность</h2>
              <UiBadge>За 7 дней</UiBadge>
            </div>
            <ul class="dashboard-activity-list">
              <li v-for="item in activity" :key="item.label"><span>{{ item.icon }}</span>{{ item.label }}<strong>{{ item.value }}</strong></li>
            </ul>
            <UiButton unstyled class="dashboard-widget__link" type="button">Смотреть всё →</UiButton>
          </UiCard>

          <UiCard raw unstyled class="dashboard-widget dashboard-security-card">
            <h2>Безопасность</h2>
            <div>
              <span aria-hidden="true">◇</span>
              <strong>Ваш аккаунт защищён</strong>
              <small>Рекомендации выполнены</small>
            </div>
            <UiButton unstyled type="button">Включите двухфакторную аутентификацию <span>›</span></UiButton>
            <UiButton unstyled href="/settings">Открыть настройки →</UiButton>
          </UiCard>

          <UiCard raw unstyled class="dashboard-widget dashboard-premium-card">
            <h2>Mecorion Premium</h2>
            <p style="marginBottom: 10px;">Больше возможностей, никаких ограничений.</p>
            <UiButton unstyled type="button">Узнать больше</UiButton>
          </UiCard>
        </aside>
      </main>
</template>
