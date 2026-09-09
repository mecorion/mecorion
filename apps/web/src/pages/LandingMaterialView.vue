<script setup>
import {computed, ref} from "vue";
import {RouterLink} from "vue-router";

const activeSurface = ref("creator");

const services = [
  {
    key: "music",
    name: "Music",
    action: "Слушай",
    color: "#ec407a",
    text: "Треки, альбомы, плейлисты, локальная библиотека и единый плеер.",
  },
  {
    key: "video",
    name: "Video",
    action: "Смотри",
    color: "#5c6bc0",
    text: "Фильмы, сериалы, каналы и пользовательский видеоконтент.",
  },
  {
    key: "books",
    name: "Books",
    action: "Читай",
    color: "#26a69a",
    text: "Книги, публикации, заметки, коллекции и прогресс чтения.",
  },
  {
    key: "course",
    name: "Course",
    action: "Учись",
    color: "#ffa726",
    text: "Курсы, интерактивные занятия, задания и образовательные маршруты.",
  },
  {
    key: "spaces",
    name: "Spaces",
    action: "Создавай",
    color: "#7e57c2",
    text: "Сообщества, авторские пространства, публикации и обсуждения.",
  },
  {
    key: "tools",
    name: "Digital tools",
    action: "Управляй",
    color: "#42a5f5",
    text: "VPN, профиль, безопасность, настройки и будущие сервисы.",
  },
];

const journey = [
  "Регистрация один раз",
  "Профиль работает везде",
  "Сервисы связаны между собой",
  "Контент собирается в личном пространстве",
];

const surfaces = [
  {
    key: "viewer",
    label: "Зритель",
    title: "Главная под твои интересы",
    text: "Музыка, видео, книги и курсы собираются в один поток без ощущения, что ты переключаешься между разными приложениями.",
    chips: ["рекомендации", "история", "подписки"],
  },
  {
    key: "creator",
    label: "Автор",
    title: "Пространство для аудитории",
    text: "Создай пространство, публикуй материалы, собирай коллекции и веди сообщество вокруг темы, проекта или личности.",
    chips: ["публикации", "пространства", "коллекции"],
  },
  {
    key: "student",
    label: "Ученик",
    title: "Обучение рядом с контентом",
    text: "Курсы, книги, видео и AI-помощь могут быть частью одного маршрута, а не разрозненными вкладками браузера.",
    chips: ["курсы", "заметки", "AI-помощь"],
  },
];

const activeSurfaceData = computed(() => surfaces.find((surface) => surface.key === activeSurface.value) ?? surfaces[0]);

const trustItems = [
  "Контроль приватности",
  "Настройки рекомендаций",
  "Безопасность аккаунта",
  "Полезный free-доступ",
];
</script>

<template>
  <main class="material-landing">
    <header class="material-nav">
      <RouterLink class="material-brand" to="/" aria-label="Mecorion">
        <span>M</span>
        <strong>Mecorion</strong>
      </RouterLink>
      <nav aria-label="Навигация по лендингу">
        <a href="#services">Сервисы</a>
        <a href="#experience">Опыт</a>
        <a href="#trust">Принципы</a>
        <RouterLink to="/sign-in">Войти</RouterLink>
      </nav>
      <RouterLink class="material-button material-button--primary" to="/sign-up">Создать аккаунт</RouterLink>
    </header>

    <section class="material-hero">
      <div class="material-hero__content">
        <p class="material-kicker">Одна экосистема для цифровой жизни</p>
        <h1>Mecorion объединяет всё, что ты смотришь, слушаешь, читаешь и создаёшь.</h1>
        <p>
          Музыка, видео, книги, обучение, сообщества и цифровые сервисы работают в одном
          интерфейсе и с одним аккаунтом на всё.
        </p>
        <div class="material-actions">
          <RouterLink class="material-button material-button--primary material-button--large" to="/sign-up">
            Начать знакомство
          </RouterLink>
          <a class="material-button material-button--tonal material-button--large" href="#services">Что внутри</a>
        </div>
      </div>

      <div class="material-device" aria-label="Превью интерфейса Mecorion">
        <div class="material-device__topbar">
          <span></span>
          <strong>mecorion.com/@you</strong>
          <i></i>
        </div>
        <div class="material-device__hero-card">
          <span>Сегодня</span>
          <strong>Продолжить с того же места</strong>
          <p>Плейлист, курс, видео и обсуждение доступны в одном профиле.</p>
        </div>
        <div class="material-service-orbit">
          <article v-for="service in services.slice(0, 5)" :key="service.key" :style="{ '--chip-color': service.color }">
            {{ service.name }}
          </article>
        </div>
      </div>
    </section>

    <section class="material-strip" aria-label="Пользовательский путь">
      <article v-for="(item, index) in journey" :key="item">
        <span>{{ index + 1 }}</span>
        <p>{{ item }}</p>
      </article>
    </section>

    <section id="services" class="material-section material-services">
      <div class="material-section__header">
        <p class="material-kicker">Сервисы</p>
        <h2>Не шесть разных приложений. Один Mecorion.</h2>
        <p>
          Каждый сервис имеет свою роль, но пользователь остаётся внутри единой системы:
          один профиль, общие настройки и понятный переход между сценариями.
        </p>
      </div>

      <div class="material-service-grid">
        <article v-for="service in services" :key="service.key" :style="{ '--service-color': service.color }">
          <div>
            <span>{{ service.action }}</span>
            <i></i>
          </div>
          <h3>{{ service.name }}</h3>
          <p>{{ service.text }}</p>
        </article>
      </div>
    </section>

    <section id="experience" class="material-section material-experience">
      <div class="material-tabs" role="tablist" aria-label="Сценарии Mecorion">
        <button
          v-for="surface in surfaces"
          :key="surface.key"
          :class="{ 'is-active': activeSurface === surface.key }"
          type="button"
          @click="activeSurface = surface.key"
        >
          {{ surface.label }}
        </button>
      </div>
      <div class="material-experience__panel">
        <div>
          <p class="material-kicker">UX для нового пользователя</p>
          <h2>{{ activeSurfaceData.title }}</h2>
          <p>{{ activeSurfaceData.text }}</p>
          <div class="material-chip-row">
            <span v-for="chip in activeSurfaceData.chips" :key="chip">{{ chip }}</span>
          </div>
        </div>
        <div class="material-profile-card" aria-label="Пример личного пространства">
          <span>YOU</span>
          <strong>@username</strong>
          <p>профиль · пространства · подписки · коллекции</p>
          <div>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
    </section>

    <section class="material-section material-spaces">
      <div>
        <p class="material-kicker">Spaces</p>
        <h2>Создавай пространство вокруг интереса, проекта или сообщества.</h2>
        <p>
          В Mecorion контент можно складывать в понятную структуру: пространство,
          разделы, публикации, медиа, файлы и обсуждения.
        </p>
      </div>
      <div class="material-space-flow">
        <span>Пространство</span>
        <span>Раздел</span>
        <span>Публикация</span>
        <span>Музыка · Видео · Текст · Файлы</span>
      </div>
    </section>

    <section id="trust" class="material-section material-trust">
      <div class="material-section__header">
        <p class="material-kicker">Принципы</p>
        <h2>Сервис должен быть полезным, понятным и управляемым.</h2>
      </div>
      <div class="material-trust__grid">
        <article v-for="item in trustItems" :key="item">
          <span></span>
          <strong>{{ item }}</strong>
          <p>Пользователь должен видеть, как устроен его аккаунт, контент, рекомендации и доступ к возможностям.</p>
        </article>
      </div>
    </section>

    <section class="material-final">
      <p class="material-kicker">Mecorion</p>
      <h2>Один аккаунт. Одна экосистема. Множество сервисов.</h2>
      <div class="material-actions">
        <RouterLink class="material-button material-button--primary material-button--large" to="/sign-up">
          Создать аккаунт
        </RouterLink>
        <RouterLink class="material-button material-button--tonal material-button--large" to="/spaces">
          Исследовать пространства
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.material-landing {
  --md-primary: #c2185b;
  --md-primary-container: #ffd8e7;
  --md-secondary: #5b5d72;
  --md-tertiary: #006a6a;
  --md-blue: #1565c0;
  --md-purple: #6a1b9a;
  --md-amber: #ef6c00;
  --md-bg: #fffbff;
  --md-surface: #ffffff;
  --md-surface-2: #f8f2f7;
  --md-surface-3: #f2ecf1;
  --md-outline: rgba(31, 31, 41, .12);
  --md-text: #1f1b20;
  --md-muted: #625b66;
  --md-shadow-1: 0 2px 8px rgba(31, 27, 32, .08);
  --md-shadow-2: 0 18px 48px rgba(31, 27, 32, .14);
  --md-radius-sm: 12px;
  --md-radius-md: 20px;
  --md-radius-lg: 28px;
  --md-radius-xl: 36px;

  min-height: 100dvh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 12% 8%, rgba(194, 24, 91, .16), transparent 28rem),
    radial-gradient(circle at 88% 16%, rgba(21, 101, 192, .13), transparent 30rem),
    linear-gradient(180deg, var(--md-bg), #f9f6ff 52%, #ffffff);
  color: var(--md-text);
  font-family: Inter, Roboto, Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.material-landing *,
.material-landing *::before,
.material-landing *::after {
  box-sizing: border-box;
}

.material-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  min-height: 80px;
  padding: 0 clamp(18px, 4vw, 64px);
  border-bottom: 1px solid var(--md-outline);
  background: rgba(255, 251, 255, .78);
  backdrop-filter: blur(20px);
}

.material-brand,
.material-nav a,
.material-button {
  color: inherit;
  text-decoration: none;
}

.material-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.material-brand span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: var(--md-primary);
  color: #ffffff;
  box-shadow: 0 10px 28px rgba(194, 24, 91, .28);
  font-weight: 850;
}

.material-brand strong {
  font-size: 19px;
  letter-spacing: 0;
}

.material-nav nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.material-nav nav a {
  border-radius: 999px;
  padding: 10px 14px;
  color: var(--md-muted);
  font-size: 14px;
  font-weight: 720;
}

.material-nav nav a:hover {
  background: var(--md-primary-container);
  color: var(--md-primary);
}

.material-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  padding: 0 22px;
  font-weight: 780;
  transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease;
}

.material-button:hover {
  transform: translateY(-2px);
}

.material-button--primary {
  background: var(--md-primary);
  color: #ffffff !important;
  box-shadow: 0 10px 28px rgba(194, 24, 91, .22);
}

.material-button--primary:hover {
  box-shadow: 0 16px 38px rgba(194, 24, 91, .3);
}

.material-button--tonal {
  background: var(--md-primary-container);
  color: var(--md-primary);
}

.material-button--large {
  min-height: 56px;
  padding-inline: 28px;
  font-size: 16px;
}

.material-hero,
.material-section,
.material-strip,
.material-final {
  width: min(100% - 40px, 1240px);
  margin-inline: auto;
}

.material-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, .86fr);
  align-items: center;
  gap: clamp(32px, 6vw, 86px);
  min-height: calc(100dvh - 80px);
  padding: clamp(36px, 6vw, 72px) 0 clamp(48px, 6vw, 76px);
}

.material-kicker {
  margin: 0;
  color: var(--md-primary);
  font-size: 13px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.material-hero h1,
.material-section h2,
.material-final h2 {
  margin: 14px 0 0;
  color: var(--md-text);
  font-size: clamp(36px, 4.1vw, 56px);
  font-weight: 880;
  letter-spacing: 0;
  line-height: 1;
}

.material-hero__content > p:not(.material-kicker),
.material-section__header > p:not(.material-kicker),
.material-spaces > div:first-child p,
.material-experience__panel p,
.material-final > p:not(.material-kicker) {
  max-width: 680px;
  margin: 22px 0 0;
  color: var(--md-muted);
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.58;
}

.material-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.material-device {
  position: relative;
  min-height: 540px;
  border: 1px solid rgba(255, 255, 255, .72);
  border-radius: var(--md-radius-xl);
  padding: 20px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .88), rgba(248, 242, 247, .74)),
    radial-gradient(circle at 50% 42%, rgba(194, 24, 91, .16), transparent 44%);
  box-shadow: var(--md-shadow-2);
  overflow: hidden;
}

.material-device::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(31, 27, 32, .055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 27, 32, .055) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle at 50% 48%, black, transparent 74%);
  content: "";
}

.material-device__topbar,
.material-device__hero-card,
.material-service-orbit article {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(18px);
  box-shadow: var(--md-shadow-1);
}

.material-device__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--md-outline);
  border-radius: 999px;
  padding: 10px 14px;
}

.material-device__topbar span,
.material-device__topbar i {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--md-primary);
}

.material-device__topbar i {
  margin-left: auto;
  background: #2e7d32;
}

.material-device__topbar strong {
  min-width: 0;
  color: var(--md-muted);
  font-size: 13px;
}

.material-device__hero-card {
  position: absolute;
  top: 116px;
  left: 50%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: min(72%, 380px);
  gap: 10px;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-lg);
  padding: 24px;
  transform: translateX(-50%);
}

.material-device__hero-card span {
  color: var(--md-primary);
  font-size: 12px;
  font-weight: 850;
}

.material-device__hero-card strong {
  font-size: clamp(22px, 2.4vw, 34px);
  line-height: 1.08;
}

.material-device__hero-card p {
  margin: 0;
  color: var(--md-muted);
  line-height: 1.45;
}

.material-service-orbit {
  position: absolute;
  inset: 34% 7% 7%;
  border: 1px solid rgba(194, 24, 91, .18);
  border-radius: 50%;
  animation: float-orbit 18s ease-in-out infinite;
}

.material-service-orbit article {
  position: absolute;
  min-width: 110px;
  border: 1px solid color-mix(in srgb, var(--chip-color) 30%, transparent);
  border-radius: 18px;
  padding: 13px 15px;
  color: var(--md-text);
  font-size: 13px;
  font-weight: 850;
}

.material-service-orbit article::before {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--chip-color);
  content: "";
}

.material-service-orbit article:nth-child(1) { top: 4%; left: 14%; }
.material-service-orbit article:nth-child(2) { top: 18%; right: 3%; }
.material-service-orbit article:nth-child(3) { top: 48%; left: -4%; }
.material-service-orbit article:nth-child(4) { right: 9%; bottom: 10%; }
.material-service-orbit article:nth-child(5) { bottom: 0; left: 24%; }

.material-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 0 0 clamp(54px, 7vw, 90px);
}

.material-strip article,
.material-service-grid article,
.material-profile-card,
.material-trust__grid article {
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-lg);
  background: var(--md-surface);
  box-shadow: var(--md-shadow-1);
}

.material-strip article {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
  padding: 18px;
}

.material-strip span {
  display: grid;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 15px;
  background: var(--md-primary-container);
  color: var(--md-primary);
  font-weight: 850;
}

.material-strip p {
  margin: 0;
  color: var(--md-text);
  font-weight: 760;
  line-height: 1.35;
}

.material-section {
  padding: clamp(58px, 8vw, 108px) 0;
}

.material-section__header {
  max-width: 820px;
  margin-bottom: 34px;
}

.material-section h2 {
  font-size: clamp(34px, 4.4vw, 64px);
  line-height: 1.04;
}

.material-service-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.material-service-grid article {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  gap: 18px;
  padding: 24px;
  background:
    radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--service-color) 22%, transparent), transparent 42%),
    var(--md-surface);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.material-service-grid article:nth-child(1),
.material-service-grid article:nth-child(4) {
  grid-column: span 5;
}

.material-service-grid article:nth-child(2),
.material-service-grid article:nth-child(5) {
  grid-column: span 3;
}

.material-service-grid article:hover {
  border-color: color-mix(in srgb, var(--service-color) 42%, transparent);
  box-shadow: var(--md-shadow-2);
  transform: translateY(-4px);
}

.material-service-grid article > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.material-service-grid article span,
.material-chip-row span {
  border-radius: 999px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--service-color, var(--md-primary)) 12%, #ffffff);
  color: var(--service-color, var(--md-primary));
  font-size: 12px;
  font-weight: 850;
}

.material-service-grid article i {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: var(--service-color);
  box-shadow: 0 12px 26px color-mix(in srgb, var(--service-color) 26%, transparent);
}

.material-service-grid h3 {
  margin: auto 0 0;
  font-size: clamp(24px, 2.3vw, 36px);
  line-height: 1.08;
}

.material-service-grid p,
.material-trust__grid p {
  margin: 0;
  color: var(--md-muted);
  line-height: 1.54;
}

.material-experience {
  border-block: 1px solid var(--md-outline);
}

.material-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.material-tabs button {
  min-height: 48px;
  border: 1px solid var(--md-outline);
  border-radius: 999px;
  padding: 0 18px;
  background: var(--md-surface);
  color: var(--md-muted);
  font: inherit;
  font-weight: 820;
  cursor: pointer;
}

.material-tabs button:hover,
.material-tabs button.is-active {
  border-color: transparent;
  background: var(--md-primary);
  color: #ffffff;
}

.material-experience__panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, .66fr);
  align-items: stretch;
  gap: 18px;
  border-radius: var(--md-radius-xl);
  padding: clamp(20px, 4vw, 34px);
  background:
    linear-gradient(135deg, var(--md-surface), var(--md-surface-2)),
    radial-gradient(circle at 80% 18%, rgba(194, 24, 91, .16), transparent 42%);
  box-shadow: var(--md-shadow-2);
}

.material-experience__panel > div:first-child {
  padding: clamp(8px, 2vw, 20px);
}

.material-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.material-profile-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 380px;
  gap: 12px;
  padding: 24px;
  background:
    radial-gradient(circle at 22% 22%, rgba(255, 216, 231, .9), transparent 34%),
    var(--md-text);
  color: #ffffff;
}

.material-profile-card > span {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--md-primary), var(--md-purple));
  font-weight: 880;
}

.material-profile-card strong {
  font-size: 28px;
}

.material-profile-card p {
  color: rgba(255, 255, 255, .76);
}

.material-profile-card div {
  display: grid;
  grid-template-columns: 1.3fr .9fr .7fr;
  gap: 10px;
  margin-top: 12px;
}

.material-profile-card i {
  min-height: 84px;
  border-radius: 18px;
  background: rgba(255, 255, 255, .12);
}

.material-spaces {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(320px, 1fr);
  align-items: center;
  gap: clamp(28px, 5vw, 72px);
}

.material-space-flow {
  display: grid;
  gap: 14px;
}

.material-space-flow span {
  display: flex;
  align-items: center;
  min-height: 88px;
  border-radius: var(--md-radius-lg);
  padding: 0 22px;
  background: var(--md-surface);
  box-shadow: var(--md-shadow-1);
  color: var(--md-text);
  font-size: clamp(18px, 2vw, 28px);
  font-weight: 850;
}

.material-space-flow span:nth-child(2) { margin-left: 48px; background: #e8def8; }
.material-space-flow span:nth-child(3) { margin-left: 96px; background: var(--md-primary-container); }
.material-space-flow span:nth-child(4) { margin-left: 144px; background: #d1e4ff; }

.material-trust__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.material-trust__grid article {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  gap: 16px;
  padding: 22px;
}

.material-trust__grid span {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: var(--md-primary-container);
}

.material-trust__grid strong {
  margin-top: auto;
  font-size: 20px;
  line-height: 1.18;
}

.material-final {
  display: grid;
  justify-items: center;
  margin-bottom: 42px;
  border-radius: var(--md-radius-xl);
  padding: clamp(52px, 8vw, 98px) 20px;
  background:
    radial-gradient(circle at 50% 0, rgba(255, 216, 231, .32), transparent 45%),
    var(--md-text);
  color: #ffffff;
  text-align: center;
}

.material-final h2 {
  max-width: 900px;
  color: #ffffff;
}

.material-final .material-kicker {
  color: #ffb1cb;
}

.material-final .material-button--tonal {
  background: rgba(255, 255, 255, .12);
  color: #ffffff;
}

@keyframes float-orbit {
  0%, 100% {
    transform: translateY(0) rotate(-1deg);
  }

  50% {
    transform: translateY(-12px) rotate(1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .material-landing *,
  .material-landing *::before,
  .material-landing *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}

@media (max-width: 1040px) {
  .material-nav,
  .material-hero,
  .material-experience__panel,
  .material-spaces {
    grid-template-columns: 1fr;
  }

  .material-nav {
    align-items: start;
    gap: 14px;
    padding-block: 18px;
  }

  .material-nav nav {
    justify-content: flex-start;
  }

  .material-hero {
    min-height: auto;
  }

  .material-strip,
  .material-trust__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .material-service-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .material-service-grid article,
  .material-service-grid article:nth-child(1),
  .material-service-grid article:nth-child(2),
  .material-service-grid article:nth-child(4),
  .material-service-grid article:nth-child(5) {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .material-hero,
  .material-section,
  .material-strip,
  .material-final {
    width: min(100% - 28px, 1240px);
  }

  .material-nav {
    position: static;
    grid-template-columns: 1fr;
  }

  .material-nav nav {
    display: none;
  }

  .material-nav > .material-button,
  .material-actions,
  .material-actions .material-button {
    width: 100%;
  }

  .material-nav nav a {
    padding-inline: 10px;
  }

  .material-hero h1 {
    font-size: clamp(32px, 10vw, 42px);
  }

  .material-device {
    min-height: 520px;
    padding: 14px;
  }

  .material-device__hero-card {
    top: 92px;
    width: calc(100% - 28px);
    padding: 18px;
  }

  .material-service-orbit {
    inset: 43% 4% 6%;
  }

  .material-service-orbit article {
    min-width: 88px;
    padding: 10px;
    font-size: 12px;
  }

  .material-service-orbit article:nth-child(1) { top: -2%; left: 0; }
  .material-service-orbit article:nth-child(2) { top: 5%; right: 0; }
  .material-service-orbit article:nth-child(3) { top: 44%; left: 0; }
  .material-service-orbit article:nth-child(4) { right: 0; bottom: 8%; }
  .material-service-orbit article:nth-child(5) { bottom: -1%; left: 18%; }

  .material-strip,
  .material-service-grid,
  .material-trust__grid {
    grid-template-columns: 1fr;
  }

  .material-space-flow span:nth-child(2),
  .material-space-flow span:nth-child(3),
  .material-space-flow span:nth-child(4) {
    margin-left: 0;
  }

  .material-profile-card {
    min-height: 320px;
  }
}
</style>
