<script setup>
import {computed, ref} from "vue";
import {UiButton, UiCard, UiBadge, UiInput, UiSelect, UiProgress, UiEmptyState} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import {publicationTypeLabels, getSpaceBreadcrumb} from "@/spaces/spaces.mock.js";

const props = defineProps({books: {type: Array, required: true}, total: {type: Number, required: true}, filters: {type: Array, required: true}, languages: {type: Array, required: true}});
const query = defineModel("query", {type: String, default: ""});
const filter = defineModel("filter", {type: String, default: "Все"});
const language = defineModel("language", {type: String, default: "Все языки"});
const format = defineModel("format", {type: String, default: ""});
const emit = defineEmits(["read"]);
const sort = ref("default");
const sorts = [{label: "Порядок каталога", value: "default"}, {label: "По названию", value: "title"}, {label: "По автору", value: "author"}, {label: "По прогрессу чтения", value: "progress"}];
const visibleBooks = computed(() => {
  const items = [...props.books];
  if (sort.value === "progress") return items.sort((a, b) => b.reader.progress - a.reader.progress);
  if (["title", "author"].includes(sort.value)) return items.sort((a, b) => a[sort.value].localeCompare(b[sort.value], "ru"));
  return items;
});
const filtered = computed(() => query.value.trim() || filter.value !== "Все" || language.value !== "Все языки" || format.value);
function reset() { query.value = ""; filter.value = "Все"; language.value = "Все языки"; format.value = ""; }
</script>

<template>
  <div class="books-library">
    <header class="books-library__heading">
      <p class="mebook-kicker">Mecorion Books</p>
      <h1>Библиотека</h1>
      <p>Книги, сборники и новые идеи. Найдите свою следующую историю.</p>
    </header>
    <UiCard raw class="books-library__filters" aria-label="Фильтры библиотеки">
      <UiInput v-model="query" clearable label="Поиск в библиотеке" placeholder="Название, автор или описание"><template #prefix><SvgIcon name="search" /></template></UiInput>
      <div class="books-library__filter-grid">
        <UiSelect v-model="filter" label="Раздел" :options="filters" />
        <UiSelect v-model="language" label="Язык" :options="languages" />
        <UiSelect v-model="format" label="Формат" :options="[{label: 'Все форматы', value: ''}, 'EPUB', 'PDF']" />
      </div>
      <div v-if="filtered" class="books-library__active">
        <UiBadge v-if="filter !== 'Все'">{{ filter }}</UiBadge>
        <UiBadge v-if="language !== 'Все языки'">{{ language }}</UiBadge>
        <UiBadge v-if="format">{{ format }}</UiBadge>
        <UiButton variant="ghost" size="sm" @click="reset">Сбросить фильтры</UiButton>
      </div>
    </UiCard>
    <section class="books-library__results" aria-labelledby="books-library-results">
      <div class="books-library__toolbar">
        <div><h2 id="books-library-results">{{ filtered ? 'Результаты поиска' : 'Все книги' }}</h2><p role="status" aria-live="polite">Показано {{ books.length }} из {{ total }}</p></div>
        <UiSelect v-model="sort" label="Сортировка" :options="sorts" />
      </div>
      <UiEmptyState v-if="!books.length" title="Книги не найдены" description="Попробуйте другой запрос или сбросьте фильтры.">
        <template #actions><UiButton variant="primary" @click="reset">Сбросить фильтры</UiButton></template>
      </UiEmptyState>
      <div v-else class="books-library__grid">
        <UiCard v-for="book in visibleBooks" :key="book.id" raw class="books-library__book">
          <UiButton unstyled class="books-library__cover" :class="`space-publication-card--${book.coverTone}`" :aria-label="`Читать: ${book.title}`" @click="emit('read', book.id)">
            <span class="books-library__cover-top"><SvgIcon name="book" /><UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge></span>
            <strong>{{ book.title }}</strong><span>{{ book.author }}</span>
          </UiButton>
          <div class="books-library__copy">
            <p class="books-library__author">{{ book.author }}</p><h3>{{ book.title }}</h3><p>{{ book.subtitle }}</p>
            <div class="books-library__meta"><UiBadge>{{ book.reader.format }}</UiBadge><span>{{ book.reader.language }}</span><span>{{ book.reader.pages }} стр.</span></div>
            <UiProgress :value="book.reader.progress" size="sm" :label="`Прочитано ${book.reader.progress}% · Страница ${book.reader.page}`" />
            <UiButton variant="primary" @click="emit('read', book.id)"><SvgIcon name="book" />{{ book.reader.progress ? 'Продолжить чтение' : 'Читать' }}</UiButton>
            <UiButton variant="ghost" :to="`/space/${book.spaceId}/publication/${book.id}`" :aria-label="`Открыть публикацию: ${book.title}`">{{ getSpaceBreadcrumb(book) }}<SvgIcon name="arrow-up-right-1" /></UiButton>
          </div>
        </UiCard>
      </div>
    </section>
  </div>
</template>
