<script setup>

import {computed, ref, watch} from "vue";
import BooksSearchView from "@/components/books/BooksSearchView.vue";
import {searchBooks} from "@/components/books/search.js";
import BooksReader from "@/components/books/BooksReader.vue";
import BooksBookmarks from "@/components/books/BooksBookmarks.vue";
import BooksLibrary from "@/components/books/BooksLibrary.vue";
import BooksHome from "@/components/books/BooksHome.vue";



import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {
  getBookServicePublications,
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
  {id: "search", icon: "search", title: "Поиск", shortTitle: "Поиск"},
  {id: "library", icon: "grid", title: "Библиотека", shortTitle: "Книги"},
  {id: "bookmarks", icon: "star", title: "Закладки", shortTitle: "Закладки"},
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
const searchInput = ref(searchQuery.value);
const searchTab = ref('all');
watch(searchQuery, value => { searchInput.value = value; searchTab.value = 'all'; });
const searchResults = computed(() => searchBooks(decoratedBooks.value, searchQuery.value));
function runSearch(value = '') {
  searchInput.value = value;
  searchTab.value = 'all';
  return router.push({path: '/books/search', query: value.trim() ? {q: value.trim()} : {}});
}
const searchConfig = {
  query: searchInput,
  suggestions: computed(() => searchBooks(decoratedBooks.value, searchInput.value).slice(0, 5).map(book => ({id: book.id, type: 'book', title: book.title, subtitle: `${book.author} · ${book.reader.format}`}))),
  placeholder: 'Поиск по Mecorion Books',
  icon: 'book',
  onInput: value => { searchInput.value = value; },
  onSubmit: runSearch,
  onSelect: item => runSearch(item.title),
  onClear: () => runSearch(),
  onActivate: () => { if (activeSection.value !== 'search') runSearch(searchInput.value); },
};
useContextNavigation({
  title: "Mecorion",
  subtitle: "Books",
  accent: "#f2b84b",
  accentStrong: "#ffd36d",
  activeId: activeSection,
  search: searchConfig,
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

        <BooksSearchView v-else-if="activeSection === 'search'" v-model:tab="searchTab" :query="searchQuery.trim()" :results="searchResults" @search="runSearch" @clear="runSearch()" />

        <BooksReader v-else :book="selectedBook" @bookmark="toggleBookmark" />
      </div>
    </section>
  </div>
</template>
