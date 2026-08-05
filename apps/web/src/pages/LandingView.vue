<script setup>
import {RouterLink} from "vue-router";

const services = [
  {title: "Music", text: "Локальные треки, плейлисты и единый плеер.", icon: "♪"},
  {title: "Video", text: "Будущий центр видео, фильмов и личной медиатеки.", icon: "▶"},
  {title: "Books", text: "Книги, заметки и прогресс чтения в одном контуре.", icon: "Aa"},
  {title: "Cloud", text: "Файлы пользователя и защищённое хранение.", icon: "☁"},
];
</script>

<template>
  <main class="landing-page">
    <header class="landing-header">
      <RouterLink class="workspace-brand" to="/" aria-label="Mecorion">
        <span class="workspace-brand__mark">M</span>
        <span>Mecorion</span>
      </RouterLink>
      <nav class="landing-header__nav" aria-label="Публичная навигация">
        <RouterLink to="/sign-in">Войти</RouterLink>
        <RouterLink class="mc-button mc-button--primary mc-button--sm" to="/sign-up">Регистрация</RouterLink>
      </nav>
    </header>

    <section class="landing-hero">
      <div class="landing-hero__copy">
        <p class="workspace-eyebrow">Единая экосистема</p>
        <h1>Mecorion собирает ваши сервисы в одном личном пространстве.</h1>
        <p>Музыка, видео, книги, облако и будущие инструменты работают отдельно, но остаются в одном аккаунте и интерфейсе.</p>
        <div class="landing-hero__actions">
          <RouterLink class="mc-button mc-button--primary mc-button--lg" to="/sign-up">Создать аккаунт</RouterLink>
          <RouterLink class="mc-button mc-button--ghost mc-button--lg" to="/sign-in">У меня уже есть аккаунт</RouterLink>
        </div>
      </div>

      <div class="landing-hero__map" aria-hidden="true">
        <span class="landing-map__core">M</span>
        <span class="landing-map__service landing-map__service--music">♪</span>
        <span class="landing-map__service landing-map__service--video">▶</span>
        <span class="landing-map__service landing-map__service--books">Aa</span>
        <span class="landing-map__service landing-map__service--cloud">☁</span>
      </div>
    </section>

    <section class="landing-services" aria-label="Сервисы Mecorion">
      <article v-for="service in services" :key="service.title" class="mc-card mc-card--interactive landing-service-card">
        <span>{{ service.icon }}</span>
        <h2>{{ service.title }}</h2>
        <p>{{ service.text }}</p>
      </article>
    </section>
  </main>
</template>
