<script setup>
import {UiButton, UiCard, UiBadge, UiProgress} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import {publicationTypeLabels} from "@/spaces/spaces.mock.js";
defineProps({book: {type: Object, required: true}});
</script>

<template>
  <UiCard raw class="books-search-card">
    <UiButton unstyled class="books-search-card__cover" :class="`space-publication-card--${book.coverTone}`" :to="`/books/${book.id}`" :aria-label="`Читать: ${book.title}`">
      <SvgIcon name="book" /><span>{{ book.reader.format }}</span>
    </UiButton>
    <div class="books-search-card__copy"><UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge><h3><UiButton unstyled class="books-search__title" :to="`/books/${book.id}`">{{ book.title }}</UiButton></h3><p>{{ book.author }}</p><p>{{ book.subtitle }}</p>
      <div class="books-search-card__meta"><UiBadge>{{ book.reader.format }}</UiBadge><span>{{ book.reader.language }}</span></div>
      <UiProgress :value="book.reader.progress" size="sm" :label="`Страница ${book.reader.page} из ${book.reader.pages}`" />
      <UiButton variant="primary" :to="`/books/${book.id}`">{{ book.reader.progress ? 'Продолжить чтение' : 'Читать' }}<SvgIcon name="chevron-right" /></UiButton>
    </div>
  </UiCard>
</template>
