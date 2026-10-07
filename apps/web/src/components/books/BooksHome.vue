<script setup>
import {computed} from "vue";
import {UiButton, UiCard, UiBadge, UiProgress, UiInput} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
const props = defineProps({books: {type: Array, required: true}, current: {type: Object, required: true}, shelves: {type: Array, required: true}});
const emit = defineEmits(["read", "browse", "shelf", "search"]);
const query = defineModel({type: String, default: ""});
const reading = computed(() => props.books.filter(book => book.id !== props.current.id && book.reader.progress > 0));
</script>

<template>
  <div class="books-home">
    <header class="books-home__heading">
      <div><p class="mebook-kicker">Mecorion Books</p><h1>Время для новой истории</h1>
        <p>Продолжайте читать или найдите книгу под настроение.</p>
      </div>
      <UiButton variant="outline" @click="emit('browse')">Открыть каталог<SvgIcon name="arrow-up-right-1" /></UiButton>
    </header>
    <section class="books-home__lead" aria-label="Продолжение чтения">
      <UiCard raw class="books-home__resume">
        <div class="books-home__cover" :class="`space-publication-card--${current.coverTone}`" aria-hidden="true"><SvgIcon name="book" /><strong>{{ current.title }}</strong><span>{{ current.author }}</span></div>
        <div class="books-home__resume-copy">
          <UiBadge>Читаю сейчас</UiBadge><h2>{{ current.title }}</h2><p>{{ current.author }}</p>
          <div class="books-home__meta"><span>{{ current.reader.language }}</span><span>{{ current.reader.format }}</span></div>
          <UiProgress :value="current.reader.progress" size="sm" :label="`Страница ${current.reader.page} из ${current.reader.pages}`" show-value />
          <UiButton variant="primary" @click="emit('read', current.id)"><SvgIcon name="book" />Продолжить чтение</UiButton>
        </div>
      </UiCard>
      <UiCard raw class="books-home__discover">
        <span class="books-home__search-icon" aria-hidden="true"><SvgIcon name="search" /></span><h2>Следующая книга — рядом</h2>
        <p>Ищите по названию, автору или описанию.</p>
        <UiInput v-model="query" clearable label="Поиск книги" placeholder="Название или автор" @keydown.enter="emit('search')"><template #prefix><SvgIcon name="search" /></template></UiInput>
        <UiButton variant="outline" @click="emit('search')">Найти книгу<SvgIcon name="chevron-right" /></UiButton>
      </UiCard>
    </section>
    <section class="books-home__section" aria-labelledby="books-shelves-title">
      <div class="books-home__section-heading"><h2 id="books-shelves-title">Мои полки</h2><span>{{ books.length }} в каталоге</span></div>
      <div class="books-home__shelves"><UiButton v-for="shelf in shelves" :key="shelf.title" variant="outline" class="books-home__shelf" @click="emit('shelf', shelf)"><SvgIcon :name="shelf.icon" /><span><strong>{{ shelf.title }}</strong><small>{{ shelf.count }} материалов</small></span><SvgIcon name="chevron-right" /></UiButton></div>
    </section>
    <section v-if="reading.length" class="books-home__section" aria-labelledby="books-reading-title">
      <div class="books-home__section-heading"><div><h2 id="books-reading-title">Продолжить чтение</h2><p>Истории, которые вы уже начали</p></div><UiButton variant="ghost" @click="emit('shelf', shelves[0])">Все начатые<SvgIcon name="chevron-right" /></UiButton></div>
      <div class="books-home__grid">
        <UiCard v-for="book in reading" :key="book.id" raw class="books-home__book">
          <UiButton unstyled class="books-home__book-art" :class="`space-publication-card--${book.coverTone}`" :aria-label="`Читать: ${book.title}`" @click="emit('read', book.id)"><SvgIcon name="book" /><span>{{ book.reader.format }}</span></UiButton>
          <div class="books-home__book-copy"><p>{{ book.author }}</p><h3>{{ book.title }}</h3><p>{{ book.subtitle }}</p>
            <UiProgress :value="book.reader.progress" size="sm" :label="`Страница ${book.reader.page} из ${book.reader.pages}`" />
            <UiButton variant="outline" @click="emit('read', book.id)">Читать<SvgIcon name="chevron-right" /></UiButton>
          </div>
        </UiCard>
      </div>
    </section>
  </div>
</template>
