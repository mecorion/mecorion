<script setup>
import {RouterLink} from "vue-router";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";
import {compactSpaces, featuredSpaces, spaceFilters} from "@/spaces/spaces.mock.js";
</script>

<template>
  <WorkspaceLayout>
    <main class="spaces-page">
      <section class="spaces-hero">
        <div>
          <p class="workspace-eyebrow">Корневое пространство</p>
          <h1>Пространства</h1>
          <p>Откройте для себя разделы Mecorion: медиа, знания, сервисы, сообщества и коллекции контента.</p>
        </div>

        <button class="spaces-create-action" type="button">
          <span>✦</span>
          Создать пространство
        </button>
      </section>

      <section class="spaces-toolbar" aria-label="Фильтры пространств">
        <div class="spaces-filter-list">
          <button
            v-for="filter in spaceFilters"
            :key="filter"
            :class="{'spaces-filter--active': filter === 'Все'}"
            type="button"
          >
            {{ filter }}
          </button>
        </div>

        <button class="spaces-sort" type="button">Сортировка: Популярное <span>⌄</span></button>
      </section>

      <section class="spaces-featured-rail" aria-label="Рекомендуемые пространства">
        <RouterLink
          v-for="space in featuredSpaces"
          :key="space.id"
          class="spaces-card"
          :class="[`spaces-card--${space.tone}`, {'spaces-card--wide': space.size === 'wide'}]"
          :to="`/space/${space.id}`"
        >
          <div class="spaces-card__content">
            <span class="spaces-card__icon">{{ space.icon }}</span>
            <h2>{{ space.title }}</h2>
            <p>{{ space.description }}</p>
          </div>

          <dl class="spaces-card__meta">
            <div><dt>{{ space.posts }}</dt><dd>публикаций</dd></div>
            <div><dt>{{ space.members }}</dt><dd>участников</dd></div>
          </dl>

          <span class="spaces-card__open" :aria-label="`Открыть ${space.title}`">→</span>
        </RouterLink>
      </section>

      <section class="spaces-compact-grid" aria-label="Другие пространства">
        <RouterLink
          v-for="space in compactSpaces"
          :key="space.id"
          class="spaces-mini-card"
          :class="`spaces-mini-card--${space.tone}`"
          :to="`/space/${space.id}`"
        >
          <span>{{ space.icon }}</span>
          <div>
            <h2>{{ space.title }}</h2>
            <p>{{ space.description }}</p>
            <small>{{ space.posts }} публикаций · {{ space.members }} участников</small>
          </div>
          <span class="spaces-mini-card__open" :aria-label="`Открыть ${space.title}`">→</span>
        </RouterLink>
      </section>

      <section class="spaces-callout">
        <span aria-hidden="true">✹</span>
        <div>
          <strong>Создавайте свои пространства</strong>
          <p>Собирайте аудиторию, публикуйте материалы и развивайте отдельные контентные контуры внутри Mecorion.</p>
        </div>
        <button type="button">Создать пространство</button>
      </section>
    </main>
  </WorkspaceLayout>
</template>
