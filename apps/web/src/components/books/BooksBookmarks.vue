<script setup>
import {computed, ref} from "vue";
import {UiButton, UiCard, UiBadge, UiInput, UiSelect, UiProgress, UiEmptyState} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import {publicationTypeLabels} from "@/spaces/spaces.mock.js";

const props = defineProps({books: {type: Array, required: true}, removed: {type: Object, default: null}});
const emit = defineEmits(["read", "remove", "undo", "browse"]);
const query = ref("");
const sort = ref("default");
const visible = computed(() => {
  const term = query.value.trim().toLocaleLowerCase();
  const items = props.books.filter(book => `${book.title} ${book.author} ${book.subtitle}`.toLocaleLowerCase().includes(term));
  if (sort.value === "title") items.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  if (sort.value === "progress") items.sort((a, b) => b.reader.progress - a.reader.progress);
  return items;
});
</script>

<template>
  <div class="books-bookmarks">
    <header class="books-library__heading">
      <p class="mebook-kicker">Моя коллекция</p><h1>Закладки</h1>
      <p>Сохранённые книги всегда под рукой. Возвращайтесь к чтению с последней страницы.</p>
    </header>
    <UiCard v-if="removed" raw class="books-bookmarks__notice" role="status">
      <p>«{{ removed.title }}» удалена из закладок.</p><UiButton variant="outline" @click="emit('undo')">Отменить удаление</UiButton>
    </UiCard>
    <div v-if="books.length" class="books-bookmarks__tools">
      <UiInput v-model="query" clearable label="Поиск в закладках" placeholder="Название или автор"><template #prefix><SvgIcon name="search" /></template></UiInput>
      <UiSelect v-model="sort" label="Сортировка" :options="[{label: 'Порядок коллекции', value: 'default'}, {label: 'По названию', value: 'title'}, {label: 'По прогрессу чтения', value: 'progress'}]" />
    </div>
    <section class="books-bookmarks__results" aria-label="Сохранённые книги">
      <p v-if="books.length" class="books-bookmarks__count" aria-live="polite">Показано {{ visible.length }} из {{ books.length }}</p>
      <UiEmptyState v-if="!books.length" title="Здесь будут ваши книги" description="Добавляйте книги в закладки, чтобы быстро находить их и продолжать чтение.">
        <template #media><SvgIcon name="star" /></template>
        <template #actions><UiButton variant="primary" @click="emit('browse')">Открыть библиотеку</UiButton></template>
      </UiEmptyState>
      <UiEmptyState v-else-if="!visible.length" title="Ничего не найдено" description="Попробуйте другое название или имя автора.">
        <template #actions><UiButton variant="outline" @click="query = ''">Очистить поиск</UiButton></template>
      </UiEmptyState>
      <UiCard v-for="book in visible" :key="book.id" raw class="books-bookmarks__book">
        <UiButton unstyled class="books-bookmarks__cover" :class="`space-publication-card--${book.coverTone}`" :aria-label="`Читать: ${book.title}`" @click="emit('read', book.id)"><SvgIcon name="book" /><strong>{{ book.title }}</strong><span>{{ book.reader.format }}</span></UiButton>
        <div class="books-bookmarks__copy">
          <div class="books-bookmarks__meta"><UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge><span>{{ book.reader.language }} · {{ book.reader.pages }} стр.</span></div>
          <h2>{{ book.title }}</h2><p>{{ book.author }}</p><p>{{ book.subtitle }}</p>
          <UiProgress :value="book.reader.progress" size="sm" :label="`Страница ${book.reader.page} из ${book.reader.pages}`" show-value />
          <div class="books-bookmarks__actions">
            <UiButton variant="primary" @click="emit('read', book.id)"><SvgIcon name="book" />Продолжить чтение</UiButton>
            <UiButton variant="ghost" :to="`/space/${book.spaceId}/publication/${book.id}`">Открыть публикацию<SvgIcon name="arrow-up-right-1" /></UiButton>
            <UiButton variant="outline" :aria-label="`Удалить из закладок: ${book.title}`" @click="emit('remove', book.id)"><SvgIcon name="star" />Убрать из закладок</UiButton>
          </div>
        </div>
      </UiCard>
    </section>
  </div>
</template>
