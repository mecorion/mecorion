<script setup>
const buttons = [
  {label: 'Primary', className: 'mc-button mc-button--primary'},
  {label: 'Soft', className: 'mc-button mc-button--soft'},
  {label: 'Ghost', className: 'mc-button mc-button--ghost'},
  {label: 'Danger', className: 'mc-button mc-button--danger'},
  {label: 'Default', className: 'mc-button'},
];

const products = [
  {logo: 'Me', title: 'Mecorion Media', text: 'Единый каталог цифрового контента'},
  {logo: 'Vi', title: 'Mecorion Video', text: 'Видео, сериалы и история просмотра'},
  {logo: 'Li', title: 'Mecorion Life', text: 'Задачи, цели, финансы и заметки'},
];

const mediaCards = [
  {logo: 'BK', title: 'Books', text: 'PDF, EPUB, закладки и прогресс чтения'},
  {logo: 'MU', title: 'Music', text: 'Альбомы, плейлисты и синхронизация'},
  {logo: 'AI', title: 'AI Tools', text: 'Помощники и интеллектуальные сценарии'},
];
</script>

<template>
  <div class="mc-page uikit-view">
    <div class="mc-shell">
      <header class="uikit-hero">
        <div>
          <p class="mc-caption mc-accent">Mecorion Design System</p>
          <h1 class="mc-title-display">UI Kit</h1>
        </div>
        <p class="mc-text-lg">
          Базовый слой компонентов для будущей экосистемы: тёмная поверхность,
          спокойная фиолетовая глубина, розовый акцент и плотные карточки.
        </p>
      </header>

      <section class="mc-section">
        <div class="mc-section__header">
          <h2 class="mc-title-2">Типографика</h2>
          <p class="mc-text">Текстовые стили используют Rubik, без отрицательного letter-spacing.</p>
        </div>

        <div class="mc-card">
          <div class="mc-card__body uikit-type-scale">
            <div>
              <p class="mc-caption">Display</p>
              <h3 class="mc-title-display">Mecorion</h3>
            </div>
            <div>
              <p class="mc-caption">Title 1</p>
              <h3 class="mc-title-1">Цифровая экосистема</h3>
            </div>
            <div>
              <p class="mc-caption">Title 2</p>
              <h3 class="mc-title-2">Каталог и сервисы</h3>
            </div>
            <div>
              <p class="mc-caption">Title 3</p>
              <h3 class="mc-title-3">Карточка продукта</h3>
            </div>
            <p class="mc-text-lg">Крупный текст для вводных блоков и описаний разделов.</p>
            <p class="mc-text">Базовый текст для интерфейса, описаний, настроек и карточек.</p>
            <p class="mc-text-sm">Вторичный текст для метаданных, статусов и пояснений.</p>
            <p class="mc-caption">Caption / 12px / medium</p>
          </div>
        </div>
      </section>

      <section class="mc-section">
        <div class="mc-section__header">
          <h2 class="mc-title-2">Кнопки</h2>
          <p class="mc-text">Основные размеры и варианты для действий в каталоге, профиле и формах.</p>
        </div>

        <div class="mc-card">
          <div class="mc-card__body mc-stack">
            <div class="mc-row">
              <button
                v-for="button in buttons"
                :key="button.label"
                :class="button.className"
                type="button"
              >
                {{ button.label }}
              </button>
            </div>

            <div class="mc-row">
              <button class="mc-button mc-button--primary mc-button--lg" type="button">Большая кнопка</button>
              <button class="mc-button mc-button--soft" type="button">Обычная кнопка</button>
              <button class="mc-button mc-button--ghost mc-button--sm" type="button">Малая</button>
              <button class="mc-button mc-button--icon" type="button" aria-label="Назад">‹</button>
              <button class="mc-button mc-button--icon mc-button--primary" type="button" aria-label="Добавить">+</button>
            </div>
          </div>
        </div>
      </section>

      <section class="mc-section">
        <div class="mc-section__header">
          <h2 class="mc-title-2">Карточки</h2>
          <p class="mc-text">Форматы для продуктов, контента и компактных списков.</p>
        </div>

        <div class="mc-grid mc-grid--3">
          <article
            v-for="product in products"
            :key="product.title"
            class="mc-card mc-card--interactive"
          >
            <div class="mc-card__body uikit-product-card">
              <div class="mc-card-logo">{{ product.logo }}</div>
              <h3 class="mc-title-3">{{ product.title }}</h3>
              <p class="mc-text-sm">{{ product.text }}</p>
              <button class="mc-button mc-button--soft mc-button--sm" type="button">Explore</button>
            </div>
          </article>
        </div>

        <div class="mc-grid mc-grid--3">
          <article
            v-for="item in mediaCards"
            :key="item.title"
            class="mc-card mc-card--interactive mc-media-card"
          >
            <div class="mc-card-logo">{{ item.logo }}</div>
            <div>
              <h3 class="mc-title-3">{{ item.title }}</h3>
              <p class="mc-text-sm">{{ item.text }}</p>
            </div>
            <button class="mc-button mc-button--icon mc-button--ghost" type="button" aria-label="Открыть">›</button>
          </article>
        </div>
      </section>

      <section class="mc-section">
        <div class="mc-section__header">
          <h2 class="mc-title-2">Формы</h2>
          <p class="mc-text">Поля рассчитаны на тёмный интерфейс и читаемые состояния фокуса.</p>
        </div>

        <form class="mc-card" @submit.prevent>
          <div class="mc-card__body">
            <div class="mc-form-grid">
              <label class="mc-field">
                <span class="mc-field__label">Название</span>
                <input class="mc-field__control" placeholder="Mecorion Media" />
              </label>

              <label class="mc-field">
                <span class="mc-field__label">Тип сервиса</span>
                <select class="mc-field__control">
                  <option>Каталог</option>
                  <option>Медиа</option>
                  <option>Персональный инструмент</option>
                </select>
              </label>
            </div>

            <label class="mc-field">
              <span class="mc-field__label">Описание</span>
              <textarea class="mc-field__control" placeholder="Короткое описание будущего модуля"></textarea>
            </label>

            <label class="mc-checkbox">
              <input type="checkbox" checked />
              <span>✓</span>
              Использовать стиль Mecorion
            </label>
          </div>

          <footer class="mc-card__footer">
            <p class="mc-text-sm">Компоненты можно переносить в отдельные Vue-компоненты по мере стабилизации.</p>
            <button class="mc-button mc-button--primary" type="submit">Сохранить</button>
          </footer>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.uikit-view {
  display: flex;
  justify-content: center;
  padding-bottom: var(--mc-space-10);
}

.uikit-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 520px);
  align-items: end;
  gap: var(--mc-space-6);
  padding: var(--mc-space-8);
  border-radius: var(--mc-radius-xl);
  background:
    radial-gradient(circle at 78% 18%, rgba(255, 111, 143, .16), transparent 34%),
    var(--mc-surface);
  border: 1px solid var(--mc-border-soft);
}

.uikit-type-scale {
  display: grid;
  gap: var(--mc-space-5);
}

.uikit-product-card {
  align-items: flex-start;
  min-height: 300px;

  .mc-card-logo {
    margin-bottom: auto;
  }
}

@media (max-width: 900px) {
  .uikit-hero {
    grid-template-columns: 1fr;
  }
}
</style>
