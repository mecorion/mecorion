<script setup>

import {computed, ref} from "vue";
import BooksReader from "@/components/books/BooksReader.vue";
import BooksBookmarks from "@/components/books/BooksBookmarks.vue";
import BooksLibrary from "@/components/books/BooksLibrary.vue";
import BooksHome from "@/components/books/BooksHome.vue";
import {UiButton, UiCard, UiBadge, UiProgress, UiInput, UiSelect, UiEmptyState} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";

import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {
  getBookServicePublications,
  getSpaceBreadcrumb,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const route = useRoute();
const router = useRouter();
const activeSection = computed(() => {
  const part = route.path.split('/')[2];
  return !part ? 'home' : ['library', 'bookmarks', 'search'].includes(part) ? part : 'reader';
});
let pendingQuery = null;
function queryModel(key, fallback) {
  return computed({
    get: () => typeof route.query[key] === 'string' ? route.query[key] : fallback,
    set: value => {
      const scheduled = pendingQuery !== null;
      const query = pendingQuery ?? {...route.query};
      if (!value || value === fallback) delete query[key]; else query[key] = value;
      pendingQuery = query;
      if (!scheduled) queueMicrotask(() => {
        const query = pendingQuery;
        pendingQuery = null;
        router.replace({path: route.path, query});
      });
    },
  });
}
const activeFilter = queryModel("filter", "Все");
const activeLanguage = queryModel("language", "Все языки");
const activeFormat = queryModel("format", "");
const searchQuery = queryModel("q", "");
const selectedBookId = computed(() => route.path.split("/")[2]);

const filters = ["Все", "Книги", "Сборники", "Продолжить", "Закладки"];
const languages = ["Все языки", "Русский", "English", "Español"];
const navigation = [
  {id: "home", icon: "home", title: "Главная", shortTitle: "Главная"},
  {id: "library", icon: "grid", title: "Библиотека", shortTitle: "Книги"},
  {id: "bookmarks", icon: "star", title: "Закладки", shortTitle: "Закладки"},
  {id: "reader", icon: "book", title: "Читалка", shortTitle: "Читать"},
];

const readerState = useState("books-reader-state", () => ({
  "author-a-selected": {page: 26, pages: 320, progress: 8, bookmarked: true, language: "Русский", format: "EPUB"},
  "sci-fi-guide": {page: 104, pages: 412, progress: 25, bookmarked: false, language: "English", format: "PDF"},
  "game-lore": {page: 18, pages: 140, progress: 13, bookmarked: true, language: "Русский", format: "EPUB"},
  "frontend-course-start": {page: 3, pages: 96, progress: 3, bookmarked: false, language: "Español", format: "PDF"},
}));
const readerStateById = readerState.value;

const removedBookmark = ref(null);
function removeBookmark(id) { removedBookmark.value = decoratedBooks.value.find(book => book.id === id); readerStateById[id].bookmarked = false; }
function undoBookmark() { if (removedBookmark.value) readerStateById[removedBookmark.value.id].bookmarked = true; removedBookmark.value = null; }
function toggleBookmark(id) { readerStateById[id].bookmarked = !readerStateById[id].bookmarked; removedBookmark.value = null; }

const decoratedBooks = computed(() => getBookServicePublications().map((book) => ({
  ...book,
  reader: readerStateById[book.id] ?? {page: 1, pages: 120, progress: 0, bookmarked: false, language: "Русский", format: "EPUB"},
})));

const books = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  let items = decoratedBooks.value;
  if (activeFormat.value) items = items.filter(item => item.reader.format === activeFormat.value);

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
useHead(() => ({title: `${activeSection.value === 'reader' ? selectedBook.value.title : ({home: 'Главная', library: 'Библиотека', bookmarks: 'Закладки', search: 'Поиск'})[activeSection.value]} · Mecorion Books`}));
const bookmarkedBooks = computed(() => decoratedBooks.value.filter((book) => book.reader.bookmarked));
const libraryShelves = computed(() => [
  {title: "Читаю сейчас", count: decoratedBooks.value.filter((book) => book.reader.progress > 0).length, icon: "arrow-up-right-1"},
  {title: "Сохранённое", count: savedBooks.value, icon: "star"},
  {title: "EPUB", count: decoratedBooks.value.filter((book) => book.reader.format === "EPUB").length, icon: "book"},
  {title: "PDF", count: decoratedBooks.value.filter((book) => book.reader.format === "PDF").length, icon: "book"},
]);

function openLibrary(filter = "Все", format = "") {
  return router.push({path: '/books/library', query: {...(filter !== 'Все' ? {filter} : {}), ...(format ? {format} : {})}});
}
function openSearch() { return router.push({path: '/books/search', query: searchQuery.value ? {q: searchQuery.value} : {}}); }
function openShelf(shelf) {
  if (shelf.title === 'Сохранённое') return navigate('bookmarks');
  return openLibrary(shelf.title === 'Читаю сейчас' ? 'Продолжить' : 'Все', ['EPUB', 'PDF'].includes(shelf.title) ? shelf.title : '');
}
function navigate(section) {
  if (section === 'reader') return openReader(continueBook.value.id);
  return router.push(section === 'home' ? '/books' : `/books/${section}`);
}
function openReader(bookId) { return router.push(`/books/${encodeURIComponent(bookId)}`); }
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
      action: () => openShelf(shelf),
    }))},
  ]),
});
</script>

<template>
  <div class="mebook-app">

    <section class="mebook-workspace">

      <div class="mebook-content">
        <BooksHome v-if="activeSection === 'home'" v-model="searchQuery" :books="decoratedBooks" :current="continueBook" :shelves="libraryShelves" @read="openReader" @browse="openLibrary()" @search="openSearch" @shelf="openShelf" />

        <BooksLibrary v-else-if="activeSection === 'library'" v-model:query="searchQuery" v-model:filter="activeFilter" v-model:language="activeLanguage" v-model:format="activeFormat" :books="books" :total="decoratedBooks.length" :filters="filters" :languages="languages" @read="openReader" />

        <BooksBookmarks v-else-if="activeSection === 'bookmarks'" :books="bookmarkedBooks" :removed="removedBookmark" @read="openReader" @remove="removeBookmark" @undo="undoBookmark" @browse="openLibrary()" />

        <template v-else-if="activeSection === 'search'">
          <section class="mebook-page-heading">
            <p class="mebook-kicker">{{ activeSection === 'search' ? 'Поиск' : activeSection === 'bookmarks' ? 'Закладки' : 'Библиотека' }}</p>
            <h1>{{ searchQuery ? `Результаты для «${searchQuery}»` : 'Просмотр всех книг и не только' }}</h1>
            <p>Фильтруйте каталог по типу, языку, закладкам и прогрессу чтения.</p>
          </section>

          <section class="mebook-filter-panel" aria-label="Фильтры Book">
            <div v-if="activeFormat"><UiBadge>{{ activeFormat }}</UiBadge><UiButton variant="ghost" size="sm" @click="activeFormat = ''">Все форматы</UiButton></div>
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

        <BooksReader v-else :book="selectedBook" @bookmark="toggleBookmark" />
      </div>
    </section>
  </div>
</template>
