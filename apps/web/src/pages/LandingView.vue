<script setup>
import {RouterLink} from "vue-router";

const orbitServices = [
  {title: "Music", label: "слушать", className: "landing-orbit__service--music"},
  {title: "Video", label: "смотреть", className: "landing-orbit__service--video"},
  {title: "Books", label: "читать", className: "landing-orbit__service--books"},
  {title: "Course", label: "учиться", className: "landing-orbit__service--course"},
  {title: "Explore", label: "публиковать", className: "landing-orbit__service--explore"},
  {title: "VPN", label: "защищать", className: "landing-orbit__service--vpn"},
];

const ecosystemSteps = ["Music", "Video", "Books", "Course"];

const services = [
  {
    title: "Mecorion Music",
    tag: "Слушать",
    text: "Музыка, исполнители, альбомы, плейлисты и новые способы взаимодействия с треками.",
    tone: "music",
    stats: ["Плейлисты", "Альбомы", "Локальная музыка"],
  },
  {
    title: "Mecorion Video",
    tag: "Смотреть",
    text: "Видео, фильмы, сериалы и пользовательский видеоконтент в одном интерфейсе.",
    tone: "video",
    stats: ["Каналы", "Сериалы", "Watch later"],
  },
  {
    title: "Mecorion Books",
    tag: "Читать",
    text: "Книги, публикации, заметки и цифровая библиотека для личного чтения.",
    tone: "books",
    stats: ["Библиотека", "Закладки", "Прогресс"],
  },
  {
    title: "Mecorion Course",
    tag: "Учиться",
    text: "Интерактивные курсы, учебные маршруты и AI-инструменты для обучения.",
    tone: "course",
    stats: ["Уроки", "Практика", "AI-помощь"],
  },
  {
    title: "Explore",
    tag: "Создавать",
    text: "Пространства, сообщества, публикации и пользовательский контент.",
    tone: "explore",
    stats: ["Spaces", "Публикации", "Аудитория"],
  },
  {
    title: "Mecorion VPN",
    tag: "Защищать",
    text: "Приватное подключение и понятные инструменты безопасности.",
    tone: "vpn",
    stats: ["Сессии", "Устройства", "Защита"],
  },
];

const spaceLevels = [
  {title: "Пространство", text: "Личная, тематическая или командная зона"},
  {title: "Раздел", text: "Структура под видео, музыку, тексты и файлы"},
  {title: "Публикация", text: "Контент, обсуждение, коллекции и реакции"},
];

const controls = ["Темы", "Авторы", "Пространства", "Источники", "Главная"];

const interfaceModes = [
  "Классический рабочий стол",
  "Минималистичный режим",
  "Галактика сервисов",
  "Виджеты и темы",
];

const aiFeatures = [
  "смысловой поиск",
  "помощь авторам",
  "интерактивное обучение",
  "перевод контента",
  "интеллектуальная навигация",
];

const roadmap = [
  {period: "Core", text: "Аккаунты, профиль, Explore и базовая структура платформы"},
  {period: "Services", text: "Music, Video, Books, Course и VPN появляются постепенно"},
  {period: "Next", text: "AI-функции, новые пространства, интеграции и цифровые инструменты"},
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
        <a href="#services">Сервисы</a>
        <a href="#spaces">Пространства</a>
        <a href="#roadmap">Roadmap</a>
        <RouterLink to="/sign-in">Войти</RouterLink>
        <RouterLink class="mc-button mc-button--primary mc-button--sm" to="/sign-up">Регистрация</RouterLink>
      </nav>
    </header>

    <section class="landing-hero">
      <div class="landing-hero__copy">
        <p class="workspace-eyebrow">Твоё цифровое пространство</p>
        <h1>Всё, что тебе интересно — в одном пространстве.</h1>
        <p>
          Mecorion объединяет музыку, видео, книги, обучение, сообщества и цифровые сервисы
          в одной экосистеме с единым аккаунтом, профилем и интерфейсом.
        </p>
        <div class="landing-hero__actions">
          <RouterLink class="mc-button mc-button--primary mc-button--lg" to="/sign-up">Начать пользоваться</RouterLink>
          <a class="mc-button mc-button--ghost mc-button--lg" href="#services">Посмотреть возможности</a>
        </div>
      </div>

      <div class="landing-hero__visual" aria-label="Экосистема Mecorion">
        <div class="landing-orbit">
          <span class="landing-orbit__ring landing-orbit__ring--outer"></span>
          <span class="landing-orbit__ring landing-orbit__ring--inner"></span>
          <div class="landing-orbit__core">
            <span>M</span>
            <strong>Mecorion</strong>
            <small>one account</small>
          </div>
          <article
            v-for="service in orbitServices"
            :key="service.title"
            class="landing-orbit__service"
            :class="service.className"
          >
            <strong>{{ service.title }}</strong>
            <small>{{ service.label }}</small>
          </article>
        </div>
      </div>
    </section>

    <section class="landing-section landing-account">
      <div class="landing-section__copy">
        <p class="workspace-eyebrow">Один аккаунт — вся экосистема</p>
        <h2>Профиль работает во всех сервисах Mecorion.</h2>
        <p>
          Не нужно заводить новый аккаунт для каждого сервиса. Настройки, подписки,
          история, избранное и переходы между продуктами остаются в одном контуре.
        </p>
      </div>
      <div class="landing-account__flow" aria-label="Переход между сервисами">
        <div class="landing-account__profile">
          <span>VD</span>
          <strong>@username</strong>
          <small>единый профиль</small>
        </div>
        <div class="landing-account__steps">
          <span v-for="step in ecosystemSteps" :key="step">{{ step }}</span>
        </div>
      </div>
    </section>

    <section id="services" class="landing-section landing-services" aria-label="Сервисы Mecorion">
      <div class="landing-section__copy landing-section__copy--center">
        <p class="workspace-eyebrow">Сервисы Mecorion</p>
        <h2>Не набор приложений, а единая цифровая среда.</h2>
        <p>
          Экосистема развивается постепенно: новые сервисы и возможности появляются со временем,
          но остаются частью одного пользовательского пространства.
        </p>
      </div>

      <div class="landing-services__showcase">
        <article
          v-for="service in services"
          :key="service.title"
          class="landing-service-card"
          :class="`landing-service-card--${service.tone}`"
        >
          <span>{{ service.tag }}</span>
          <h3>{{ service.title }}</h3>
          <p>{{ service.text }}</p>
          <div>
            <small v-for="item in service.stats" :key="item">{{ item }}</small>
          </div>
        </article>
      </div>
    </section>

    <section id="spaces" class="landing-section landing-spaces">
      <div class="landing-space-map">
        <article v-for="level in spaceLevels" :key="level.title">
          <strong>{{ level.title }}</strong>
          <span>{{ level.text }}</span>
        </article>
      </div>
      <div class="landing-section__copy">
        <p class="workspace-eyebrow">Пространства</p>
        <h2>Контент живёт внутри пользовательских пространств.</h2>
        <p>
          Создавайте пространства, подписывайтесь на авторов, публикуйте материалы,
          собирайте аудиторию и выбирайте собственную структуру для контента.
        </p>
      </div>
    </section>

    <section class="landing-section landing-profile">
      <div class="landing-section__copy">
        <p class="workspace-eyebrow">Личное пространство</p>
        <h2>Твоё место в Mecorion.</h2>
        <p>
          Профиль вида mecorion.com/@username собирает публикации, коллекции,
          подписки, пространства, достижения, роли и созданный контент.
        </p>
      </div>
      <div class="landing-profile__mockup" aria-label="Профиль пользователя">
        <div class="landing-profile__header">
          <span>VD</span>
          <div>
            <strong>@username</strong>
            <small>creator · agent · music curator</small>
          </div>
        </div>
        <div class="landing-profile__tabs">
          <span>Публикации</span>
          <span>Коллекции</span>
          <span>Spaces</span>
        </div>
        <div class="landing-profile__content">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </section>

    <section class="landing-section landing-values">
      <article>
        <p class="workspace-eyebrow">Приватность</p>
        <h2>Создано для пользователей, а не рекламных алгоритмов.</h2>
        <p>
          Mecorion делает ставку на минимальный сбор данных, понятные настройки,
          контроль над аккаунтом и модели монетизации без необходимости строить
          подробный рекламный профиль пользователя.
        </p>
      </article>
      <article>
        <p class="workspace-eyebrow">Рекомендации</p>
        <h2>Алгоритмы помогают искать, но не решают за вас.</h2>
        <p>
          Пользователь управляет темами, авторами, пространствами, источниками,
          рекомендациями и внешним видом главной страницы.
        </p>
        <div class="landing-controls">
          <span v-for="control in controls" :key="control">{{ control }}</span>
        </div>
      </article>
    </section>

    <section class="landing-section landing-custom">
      <div class="landing-section__copy">
        <p class="workspace-eyebrow">Кастомизация</p>
        <h2>Mecorion может выглядеть так, как удобно вам.</h2>
        <p>
          Рабочий стол, минималистичный режим, галактика сервисов, виджеты,
          темы и разные layouts могут жить поверх одной платформенной основы.
        </p>
      </div>
      <div class="landing-custom__modes">
        <span v-for="mode in interfaceModes" :key="mode">{{ mode }}</span>
      </div>
    </section>

    <section class="landing-section landing-ai">
      <div class="landing-ai__panel">
        <span class="landing-ai__badge">AI experiment</span>
        <h2>AI там, где он действительно полезен.</h2>
        <p>
          В Mecorion AI может помогать искать смысл, авторам — готовить материалы,
          учащимся — проходить интерактивные курсы, а контенту — становиться доступнее
          через перевод и адаптацию.
        </p>
        <div class="landing-ai__features">
          <span v-for="feature in aiFeatures" :key="feature">{{ feature }}</span>
        </div>
      </div>
      <div class="landing-ai__music">
        <small>Mecorion Music concept</small>
        <strong>Адаптация песни на другой язык с сохранением смысла, ритма и характера оригинала.</strong>
        <span>Будущая экспериментальная функция</span>
      </div>
    </section>

    <section class="landing-section landing-community">
      <div class="landing-community__ladder">
        <span>User</span>
        <span>Agent</span>
        <span>Keeper</span>
      </div>
      <div class="landing-section__copy">
        <p class="workspace-eyebrow">Сообщество и безопасность</p>
        <h2>Ваш аккаунт принадлежит вам, а платформа развивается вместе с людьми.</h2>
        <p>
          Активные участники могут развивать пространства, публиковать, модерировать,
          участвовать в обсуждении решений и пользоваться настройками сессий,
          устройств, восстановления доступа и приватности.
        </p>
      </div>
    </section>

    <section class="landing-section landing-plans">
      <article>
        <span>Free</span>
        <h3>Полезен без подписки</h3>
        <p>Базовые сервисы, профиль, пространства, публикации и основные возможности платформы.</p>
      </article>
      <article>
        <span>Premium</span>
        <h3>Больше возможностей</h3>
        <p>Расширенная кастомизация, дополнительные функции, AI-возможности, premium themes и новые сервисы.</p>
      </article>
    </section>

    <section class="landing-section landing-unify">
      <div class="landing-unify__sources">
        <span>Music</span>
        <span>Video</span>
        <span>Books</span>
        <span>Courses</span>
        <span>Communities</span>
        <span>VPN</span>
        <span>AI</span>
        <span>Digital tools</span>
      </div>
      <div class="landing-unify__core">
        <strong>MECORION</strong>
        <p>Один аккаунт. Один интерфейс. Одна экосистема.</p>
      </div>
    </section>

    <section id="roadmap" class="landing-section landing-roadmap">
      <div class="landing-section__copy landing-section__copy--center">
        <p class="workspace-eyebrow">Roadmap</p>
        <h2>Платформа растёт честно и поэтапно.</h2>
      </div>
      <div class="landing-roadmap__timeline">
        <article v-for="item in roadmap" :key="item.period">
          <span>{{ item.period }}</span>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section class="landing-final">
      <p class="workspace-eyebrow">Mecorion</p>
      <h2>Интернет-сервисы могут быть другими.</h2>
      <p>Твоё цифровое пространство начинается здесь.</p>
      <div class="landing-hero__actions">
        <RouterLink class="mc-button mc-button--primary mc-button--lg" to="/sign-up">Создать аккаунт</RouterLink>
        <RouterLink class="mc-button mc-button--ghost mc-button--lg" to="/spaces">Исследовать Mecorion</RouterLink>
      </div>
    </section>
  </main>
</template>
