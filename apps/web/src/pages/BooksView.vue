<script setup>
import {computed, ref} from "vue";
import {RouterLink} from "vue-router";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";
import {
  getBookServicePublications,
  getSpaceBreadcrumb,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const activeFilter = ref("Все");
const filters = ["Все", "Книги", "Сборники"];

const books = computed(() => {
  const items = getBookServicePublications();

  if (activeFilter.value === "Книги") {
    return items.filter((item) => item.type === "book");
  }

  if (activeFilter.value === "Сборники") {
    return items.filter((item) => item.type === "collection");
  }

  return items;
});
</script>

<template>
  <WorkspaceLayout>
    <main class="book-service-page">
      <section class="book-service-hero">
        <div>
          <p class="workspace-eyebrow">Mecorion Book</p>
          <h1>Книги со всех пространств</h1>
          <p>
            Сервис Book собирает книги и сборники, которые пользователи публикуют в пространствах.
            Пространства дают дерево и контекст, сервис даёт быстрый общий каталог.
          </p>
        </div>
        <div class="book-service-hero__stats">
          <strong>{{ getBookServicePublications().length }}</strong>
          <span>материала сейчас</span>
        </div>
      </section>

      <section class="spaces-toolbar" aria-label="Фильтры Book">
        <div class="spaces-filter-list">
          <button
            v-for="filter in filters"
            :key="filter"
            :class="{'spaces-filter--active': activeFilter === filter}"
            type="button"
            @click="activeFilter = filter"
          >
            {{ filter }}
          </button>
        </div>
        <button class="spaces-sort" type="button">Сортировка: Новые <span>⌄</span></button>
      </section>

      <section class="book-grid">
        <RouterLink
          v-for="book in books"
          :key="book.id"
          class="book-card"
          :class="`space-publication-card--${book.coverTone}`"
          :to="`/space/${book.spaceId}/publication/${book.id}`"
        >
          <span>{{ publicationTypeLabels[book.type] }}</span>
          <h2>{{ book.title }}</h2>
          <p>{{ book.subtitle }}</p>
          <footer>
            <small>{{ getSpaceBreadcrumb(book) }}</small>
            <small>{{ book.duration }}</small>
          </footer>
        </RouterLink>
      </section>
    </main>
  </WorkspaceLayout>
</template>
