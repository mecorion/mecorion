<script setup>
definePageMeta({layout: 'auth', standalone: true});

const services = [
  {title: "Music", text: "Локальные треки, плейлисты и единый плеер.", icon: "♪", to: "/music"},
  {title: "Video", text: "Будущий центр видео, фильмов и личной медиатеки.", icon: "▶", to: "/video"},
  {title: "Books", text: "Книги, заметки и прогресс чтения в одном контуре.", icon: "Aa", to: "/books"},
  {title: "Cloud", text: "Файлы пользователя и защищённое хранение.", icon: "☁", to: "/drive"},
];
</script>

<template>
  <main class="landing-page">

    <section class="landing-hero">
      <div class="landing-hero__copy">
        <p class="workspace-eyebrow">Единая экосистема</p>
        <h1>Mecorion собирает ваши сервисы в одном личном пространстве.</h1>
        <p>Музыка, видео, книги, облако и будущие инструменты работают отдельно, но остаются в одном аккаунте и интерфейсе.</p>
        <div class="landing-hero__actions">
          <NuxtLink class="mc-button mc-button--primary mc-button--lg" to="/sign-up">Создать аккаунт</NuxtLink>
          <NuxtLink class="mc-button mc-button--ghost mc-button--lg" to="/sign-in">У меня уже есть аккаунт</NuxtLink>
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
      <NuxtLink v-for="service in services" :key="service.title" class="mc-card mc-card--interactive landing-service-card" :to="service.to" :aria-label="`Открыть Mecorion ${service.title}`">
        <span>{{ service.icon }}</span>
        <h2>{{ service.title }}</h2>
        <p>{{ service.text }}</p>
      </NuxtLink>
    </section>
  </main>
</template>
