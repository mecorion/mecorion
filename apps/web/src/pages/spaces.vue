<script setup>
definePageMeta({workspace: true, requiresAuth: true});

import {computed, ref} from "vue";
import {rootSpaces, spaceFilters} from "@/spaces/spaces.mock.js";
import UiBreadcrumb from "@/components/ui/UiBreadcrumb.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiEmptyState from "@/components/ui/UiEmptyState.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiToggle from "@/components/ui/UiToggle.vue";

const activeFilter = ref("Все");
const activeSort = ref("popular");
const sortOptions = [
  {label: "Популярное", value: "popular"},
  {label: "Больше публикаций", value: "posts"},
  {label: "По названию", value: "title"},
];

const metricValue = (value) => {
  const normalized = String(value).toUpperCase();
  const number = Number.parseFloat(normalized);
  return normalized.endsWith("K") ? number * 1000 : number;
};

const visibleSpaces = computed(() => {
  const filtered = activeFilter.value === "Все"
    ? rootSpaces
    : rootSpaces.filter((space) => space.category === activeFilter.value);

  return [...filtered].sort((left, right) => {
    if (activeSort.value === "title") return left.title.localeCompare(right.title, "ru");
    if (activeSort.value === "posts") return metricValue(right.posts) - metricValue(left.posts);
    return metricValue(right.members) - metricValue(left.members);
  });
});

const featuredSpaces = computed(() => visibleSpaces.value.slice(0, 8));
const compactSpaces = computed(() => visibleSpaces.value.slice(8));
</script>

<template>
    <main class="spaces-page">
      <UiBreadcrumb class="mcrn-route-path" :items="[{label: 'Главная', to: '/dashboard'}, {label: 'Пространства', current: true}]" separator="/" aria-label="Путь" />

      <section class="spaces-hero">
        <div>
          <p class="workspace-eyebrow">Корневое пространство</p>
          <h1>Пространства</h1>
          <p>Откройте для себя разделы Mecorion: медиа, знания, сервисы, сообщества и коллекции контента.</p>
        </div>

        <UiButton unstyled class="spaces-create-action" type="button">
          <span>✦</span>
          Создать пространство
        </UiButton>
      </section>

      <section class="spaces-toolbar" aria-label="Фильтры пространств">
        <div class="spaces-filter-list">
          <UiToggle
            v-for="filter in spaceFilters"
            :key="filter"
            :model-value="activeFilter === filter"
            :class="{'spaces-filter--active': activeFilter === filter}"
            @update:model-value="activeFilter = filter"
          >
            {{ filter }}
          </UiToggle>
        </div>

        <div class="spaces-sort-control">
          <UiSelect v-model="activeSort" class="spaces-sort" :options="sortOptions" aria-label="Сортировка пространств" />
        </div>
      </section>

      <template v-if="visibleSpaces.length">
      <section class="spaces-featured-rail" aria-label="Рекомендуемые пространства">
        <UiCard
          v-for="space in featuredSpaces"
          :key="space.id"
          raw
          unstyled
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
        </UiCard>
      </section>

      <section class="spaces-compact-grid" aria-label="Другие пространства">
        <UiCard
          v-for="space in compactSpaces"
          :key="space.id"
          raw
          unstyled
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
        </UiCard>
      </section>
      </template>

      <UiEmptyState v-else title="Пространства не найдены" description="В выбранной категории пока нет пространств." media-variant="outline">
        <template #media><span aria-hidden="true">⌕</span></template>
        <template #actions><UiButton variant="outline" @click="activeFilter = 'Все'">Сбросить фильтр</UiButton></template>
      </UiEmptyState>

      <UiCard raw unstyled class="spaces-callout">
        <span aria-hidden="true">✹</span>
        <div>
          <strong>Создавайте свои пространства</strong>
          <p>Собирайте аудиторию, публикуйте материалы и развивайте отдельные контентные контуры внутри Mecorion.</p>
        </div>
        <UiButton unstyled type="button">Создать пространство</UiButton>
      </UiCard>
    </main>
</template>
