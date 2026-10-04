<script setup>
import {computed} from "vue";
import {UiButton, UiCard, UiTabs, UiEmptyState} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import BookSearchCard from "./BookSearchCard.vue";
const props = defineProps({query: {type: String, default: ""}, results: {type: Array, default: () => []}});
const emit = defineEmits(["search", "clear"]);
const tab = defineModel("tab", {type: String, default: "all"});
const tabs = [{value: 'all', label: 'Все'}, {value: 'book', label: 'Книги'}, {value: 'collection', label: 'Сборники'}, {value: 'EPUB', label: 'EPUB'}, {value: 'PDF', label: 'PDF'}];
const visible = computed(() => tab.value === 'all' ? props.results : props.results.filter(book => book.type === tab.value || book.reader.format === tab.value));
</script>

<template>
  <section class="memusic-search-view books-search" aria-label="Поиск книг">
    <div v-if="!query" class="music-search__welcome">
      <div class="music-search__intro"><p class="music-search__eyebrow">Mecorion Books / Поиск</p><h1>Что будем читать?</h1><p class="music-search__description">Ищите книги и сборники по названию, автору или описанию.</p><p class="music-search__quick-label">Начните с темы или формата</p><div class="music-search__explore-chips"><UiButton v-for="term in ['Фантастика', 'Игровой мир', 'Сборник', 'EPUB', 'PDF']" :key="term" variant="outline" @click="emit('search', term === 'Фантастика' ? 'фантаст' : term)">{{ term }}</UiButton></div></div>
      <div class="music-search__explore" aria-hidden="true"><div class="music-search__orbit"><SvgIcon name="book" /></div><span class="music-search__visual-caption">Ваша следующая история уже близко</span></div>
    </div>
    <div v-else class="music-search__results">
      <h1>Результаты по запросу «{{ query }}»</h1><UiTabs v-model="tab" :items="tabs" class="books-search__tabs" /><p role="status" aria-live="polite">Найдено: {{ visible.length }}</p>
      <UiEmptyState v-if="!visible.length" title="Ничего не найдено" description="Попробуйте другое название, автора или категорию."><template #media><SvgIcon name="search" /></template><template #actions><UiButton v-if="tab !== 'all' && results.length" variant="primary" @click="tab = 'all'">Все результаты</UiButton><UiButton variant="outline" @click="emit('clear')">Очистить поиск</UiButton></template></UiEmptyState>
      <template v-else>
        <div v-if="tab === 'all'" class="music-search__overview">
          <section class="music-search__best"><h2>Лучший результат</h2><BookSearchCard :book="results[0]" /></section>
          <section v-if="results.length > 1" class="music-search__quick"><h2>Быстрые результаты</h2><UiCard v-for="book in results.slice(1, 5)" :key="book.id" raw unstyled class="music-search__quick-card"><UiButton unstyled class="music-search__quick-button" :to="`/books/${book.id}`"><SvgIcon name="book" /><span><strong>{{ book.title }}</strong><small>{{ book.author }} · {{ book.reader.format }}</small></span><SvgIcon name="chevron-right" /></UiButton></UiCard></section>
        </div>
        <section class="music-search__section"><h2>{{ tabs.find(item => item.value === tab)?.label === 'Все' ? 'Все книги' : tabs.find(item => item.value === tab)?.label }}</h2><div class="books-library__grid"><BookSearchCard v-for="book in visible" :key="book.id" :book="book" /></div></section>
      </template>
    </div>
  </section>
</template>
