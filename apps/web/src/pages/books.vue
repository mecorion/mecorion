<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import {computed, ref} from "vue";
import {UiButton, UiCard, UiBadge, UiProgress, UiInput, UiSelect, UiEmptyState} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";

import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {
  getBookServicePublications,
  getSpaceBreadcrumb,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const activeSection = ref("home");
const activeFilter = ref("Все");
const activeLanguage = ref("Все языки");
const searchQuery = ref("");
const selectedBookId = ref(null);

const filters = ["Все", "Книги", "Сборники", "Продолжить", "Закладки"];
const languages = ["Все языки", "Русский", "English", "Español"];
const navigation = [
  {id: "home", icon: "home", title: "Главная", shortTitle: "Главная"},
  {id: "library", icon: "grid", title: "Библиотека", shortTitle: "Книги"},
  {id: "bookmarks", icon: "star", title: "Закладки", shortTitle: "Закладки"},
  {id: "reader", icon: "book", title: "Читалка", shortTitle: "Читать"},
];

const readerStateById = {
  "author-a-selected": {page: 26, pages: 320, progress: 8, bookmarked: true, language: "Русский", format: "EPUB"},
  "sci-fi-guide": {page: 104, pages: 412, progress: 25, bookmarked: false, language: "English", format: "PDF"},
  "game-lore": {page: 18, pages: 140, progress: 13, bookmarked: true, language: "Русский", format: "EPUB"},
  "frontend-course-start": {page: 3, pages: 96, progress: 3, bookmarked: false, language: "Español", format: "PDF"},
};

const decoratedBooks = computed(() => getBookServicePublications().map((book) => ({
  ...book,
  reader: readerStateById[book.id] ?? {page: 1, pages: 120, progress: 0, bookmarked: false, language: "Русский", format: "EPUB"},
})));

const books = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  let items = decoratedBooks.value;

  if (activeFilter.value === "Книги") {
    items = items.filter((item) => item.type === "book");
  }

  if (activeFilter.value === "Сборники") {
    items = items.filter((item) => item.type === "collection");
  }

  if (activeFilter.value === "Продолжить") {
    items = items.filter((item) => item.reader.progress > 0);
  }

  if (activeFilter.value === "Закладки") {
    items = items.filter((item) => item.reader.bookmarked);
  }

  if (activeLanguage.value !== "Все языки") {
    items = items.filter((item) => item.reader.language === activeLanguage.value);
  }

  if (query) {
    items = items.filter((item) => `${item.title} ${item.subtitle} ${item.author}`.toLowerCase().includes(query));
  }

  return items;
});

const continueBook = computed(() => decoratedBooks.value.find((book) => book.reader.progress > 0) ?? decoratedBooks.value[0]);
const savedBooks = computed(() => decoratedBooks.value.filter((book) => book.reader.bookmarked).length);
const selectedBook = computed(() => decoratedBooks.value.find((book) => book.id === selectedBookId.value) ?? continueBook.value);
const bookmarkedBooks = computed(() => decoratedBooks.value.filter((book) => book.reader.bookmarked));
const libraryShelves = computed(() => [
  {title: "Читаю сейчас", count: decoratedBooks.value.filter((book) => book.reader.progress > 0).length, icon: "arrow-up-right-1"},
  {title: "Сохранённое", count: savedBooks.value, icon: "star"},
  {title: "EPUB", count: decoratedBooks.value.filter((book) => book.reader.format === "EPUB").length, icon: "book"},
  {title: "PDF", count: decoratedBooks.value.filter((book) => book.reader.format === "PDF").length, icon: "book"},
]);

function navigate(section) {
  activeSection.value = section;
  if (section === "bookmarks") {
    activeFilter.value = "Закладки";
  }
}

function openReader(bookId) {
  selectedBookId.value = bookId;
  activeSection.value = "reader";
}

useContextNavigation({
  title: "Mecorion",
  subtitle: "Books",
  accent: "#f2b84b",
  accentStrong: "#ffd36d",
  activeId: activeSection,
  groups: computed(() => [
    {label: null, navLabel: "Разделы Books", items: navigation.map((item) => ({...item, icon: item.icon, action: () => navigate(item.id)}))},
    {label: "Полки", items: libraryShelves.value.map((shelf) => ({
      title: `${shelf.title} · ${shelf.count}`,
      icon: shelf.icon,
      action: () => navigate("library"),
    }))},
  ]),
});
</script>

<template>
  <div class="mebook-app">

    <section class="mebook-workspace">

      <main class="mebook-content">
        <template v-if="activeSection === 'home'">
          <section class="mebook-hero">
            <div class="mebook-hero__copy">
              <p class="mebook-kicker">Mecorion Book</p>
              <h1>Здесь собраны все возможные книги</h1>
              <p><span>Book</span> помогает найти книгу, выбрать язык, сохранить страницу и продолжить чтение там, где вы остановились.</p>
              <div class="mebook-hero__actions">
                <UiButton variant="primary" type="button" @click="openReader(continueBook.id)">Продолжить чтение</UiButton>
                <UiButton variant="outline" type="button" @click="activeSection = 'search'">Найти книгу</UiButton>
              </div>
            </div>
            <UiCard raw class="mebook-current-card" :class="`space-publication-card--${continueBook.coverTone}`">
              <UiBadge>Сейчас читается</UiBadge>
              <h2>{{ continueBook.title }}</h2>
              <p>Страница {{ continueBook.reader.page }} из {{ continueBook.reader.pages }}</p>
              <UiProgress :value="continueBook.reader.progress" size="sm" />
            </UiCard>
          </section>

          <section class="mebook-shelf-grid" aria-label="Быстрые полки">
            <UiButton v-for="shelf in libraryShelves" :key="shelf.title" type="button" @click="activeSection = 'library'">
              <span aria-hidden="true"><SvgIcon :name="shelf.icon" /></span>
              <strong>{{ shelf.title }}</strong>
              <small>{{ shelf.count }} материалов</small>
            </UiButton>
          </section>

          <section class="mebook-section">
            <div class="mebook-section-heading"><h2>Продолжить</h2><UiButton variant="primary" type="button" @click="activeSection = 'library'">Смотреть всё</UiButton></div>
            <div class="mebook-card-grid">
              <UiCard raw
                v-for="book in decoratedBooks.filter((item) => item.reader.progress > 0)"
                :key="book.id"
                class="mebook-card"
                :class="`space-publication-card--${book.coverTone}`"
              >
                <UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge>
                <h3>{{ book.title }}</h3>
                <p>{{ book.subtitle }}</p>
                <UiProgress :value="book.reader.progress" size="sm" />
                <footer><small>{{ book.reader.language }} · {{ book.reader.format }}</small><UiButton variant="primary" type="button" @click="openReader(book.id)">Читать</UiButton></footer>
              </UiCard>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'search' || activeSection === 'library' || activeSection === 'bookmarks'">
          <section class="mebook-page-heading">
            <p class="mebook-kicker">{{ activeSection === 'search' ? 'Поиск' : activeSection === 'bookmarks' ? 'Закладки' : 'Библиотека' }}</p>
            <h1>{{ searchQuery ? `Результаты для «${searchQuery}»` : 'Просмотр всех книг и не только' }}</h1>
            <p>Фильтруйте каталог по типу, языку, закладкам и прогрессу чтения.</p>
          </section>

          <section class="mebook-filter-panel" aria-label="Фильтры Book">
            <UiInput v-model="searchQuery" clearable placeholder="Найти книгу" aria-label="Поиск книги"><template #prefix><SvgIcon name="search" /></template></UiInput>
            <UiSelect v-model="activeFilter" label="Раздел" :options="filters" />
            <UiSelect v-model="activeLanguage" label="Язык" :options="languages" />
          </section>

          <section class="mebook-card-grid">
            <UiEmptyState v-if="!books.length" title="Книги не найдены" description="Попробуйте изменить поиск или фильтры." />
            <UiCard raw
              v-for="book in books"
              :key="book.id"
              class="mebook-card"
              :class="`space-publication-card--${book.coverTone}`"
            >
              <UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge>
              <h3>{{ book.title }}</h3>
              <p>{{ book.subtitle }}</p>
              <UiProgress :value="book.reader.progress" size="sm" />
              <footer>
                <small>{{ book.reader.language }} · {{ book.reader.format }}</small>
                <UiButton variant="primary" type="button" @click="openReader(book.id)">Читать</UiButton>
              </footer>
              <UiButton variant="ghost" :to="`/space/${book.spaceId}/publication/${book.id}`">{{ getSpaceBreadcrumb(book) }}</UiButton>
            </UiCard>
          </section>
        </template>

        <template v-else>
          <section class="mebook-reader">
            <aside class="mebook-reader__book">
              <UiCard raw class="mebook-reader__cover" :class="`space-publication-card--${selectedBook.coverTone}`">
                <UiBadge>{{ publicationTypeLabels[selectedBook.type] }}</UiBadge>
                <strong>{{ selectedBook.title }}</strong>
              </UiCard>
              <UiButton variant="primary" type="button">Добавить закладку</UiButton>
              <UiButton variant="ghost" :to="`/space/${selectedBook.spaceId}/publication/${selectedBook.id}`">Открыть публикацию</UiButton>
            </aside>

            <UiCard raw class="mebook-reader__page">
              <p class="mebook-kicker">{{ selectedBook.reader.language }} · {{ selectedBook.reader.format }}</p>
              <h1>{{ selectedBook.title }}</h1>
              <p>
                Это прототип режима чтения. Здесь будет текст книги, настройки шрифта,
                оглавление, заметки, перевод, выбор языка и синхронизация последней страницы.
              </p>
              <p>
                Сейчас сохранена страница {{ selectedBook.reader.page }} из {{ selectedBook.reader.pages }}.
                При подключении API это состояние будет храниться в профиле пользователя.
              </p>
              <div class="mebook-reader__controls">
                <UiButton variant="outline" type="button"><SvgIcon name="chevron-right" class="mebook-reader__previous" />Назад</UiButton>
                <UiProgress :value="selectedBook.reader.progress" size="sm" />
                <UiButton variant="primary" type="button">Дальше<SvgIcon name="chevron-right" /></UiButton>
              </div>
            </UiCard>
          </section>
        </template>
      </main>
    </section>
  </div>
</template>
