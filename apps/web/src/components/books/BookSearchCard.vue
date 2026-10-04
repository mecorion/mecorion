<script setup>
import {UiButton, UiCard, UiBadge, UiProgress} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import {publicationTypeLabels} from "@/spaces/spaces.mock.js";
defineProps({book: {type: Object, required: true}});
</script>

<template>
  <UiCard raw class="books-library__book">
    <UiButton unstyled class="books-library__cover" :class="`space-publication-card--${book.coverTone}`" :to="`/books/${book.id}`" :aria-label="`Читать: ${book.title}`">
      <span class="books-library__cover-top"><SvgIcon name="book" /><UiBadge>{{ publicationTypeLabels[book.type] }}</UiBadge></span><strong>{{ book.title }}</strong><span>{{ book.author }}</span>
    </UiButton>
    <div class="books-library__copy"><p>{{ book.author }}</p><h3><UiButton unstyled class="books-search__title" :to="`/books/${book.id}`">{{ book.title }}</UiButton></h3><p>{{ book.subtitle }}</p>
      <div class="books-library__meta"><UiBadge>{{ book.reader.format }}</UiBadge><span>{{ book.reader.language }}</span></div>
      <UiProgress :value="book.reader.progress" size="sm" :label="`Страница ${book.reader.page} из ${book.reader.pages}`" />
      <UiButton variant="primary" :to="`/books/${book.id}`">{{ book.reader.progress ? 'Продолжить чтение' : 'Читать' }}<SvgIcon name="chevron-right" /></UiButton>
    </div>
  </UiCard>
</template>
