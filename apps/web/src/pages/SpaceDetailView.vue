<script setup>
import {computed, ref} from "vue";
import {RouterLink, useRoute} from "vue-router";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";
import {
  getPublicationsBySpace,
  getPublicationsBySubspace,
  getSpaceById,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const route = useRoute();
const selectedSubspaceId = ref("all");

const space = computed(() => getSpaceById(route.params.id));
const publications = computed(() => {
  if (!space.value) {
    return [];
  }

  return selectedSubspaceId.value === "all"
    ? getPublicationsBySpace(space.value.id)
    : getPublicationsBySubspace(selectedSubspaceId.value);
});
</script>

<template>
  <WorkspaceLayout>
    <main v-if="space" class="space-detail-page">
      <section class="space-detail-hero" :class="`spaces-card--${space.tone}`">
        <RouterLink class="space-back-link" to="/spaces">← Все пространства</RouterLink>
        <div class="space-detail-hero__content">
          <span class="spaces-card__icon">{{ space.icon }}</span>
          <p class="workspace-eyebrow">{{ space.category }}</p>
          <h1>{{ space.title }}</h1>
          <p>{{ space.summary || space.description }}</p>
        </div>
        <dl class="space-detail-stats">
          <div><dt>{{ space.posts }}</dt><dd>публикаций</dd></div>
          <div><dt>{{ space.members }}</dt><dd>участников</dd></div>
          <div><dt>{{ space.subspaces.length }}</dt><dd>подпространств</dd></div>
        </dl>
      </section>

      <section class="space-subspaces" aria-label="Подпространства">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Дерево пространства</p>
            <h2>Подпространства</h2>
          </div>
          <button type="button">Создать подпространство</button>
        </div>

        <div class="space-subspace-grid">
          <button
            class="space-subspace-card"
            :class="{'space-subspace-card--active': selectedSubspaceId === 'all'}"
            type="button"
            @click="selectedSubspaceId = 'all'"
          >
            <span>⌘</span>
            <strong>Все публикации</strong>
            <small>Общий поток пространства</small>
          </button>
          <button
            v-for="subspace in space.subspaces"
            :key="subspace.id"
            class="space-subspace-card"
            :class="{'space-subspace-card--active': selectedSubspaceId === subspace.id}"
            type="button"
            @click="selectedSubspaceId = subspace.id"
          >
            <span>▧</span>
            <strong>{{ subspace.title }}</strong>
            <small>{{ subspace.description }}</small>
          </button>
        </div>
      </section>

      <section class="space-publications">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Публикации</p>
            <h2>{{ publications.length }} материалов</h2>
          </div>
          <button type="button">Новая публикация</button>
        </div>

        <div class="space-publication-grid">
          <RouterLink
            v-for="publication in publications"
            :key="publication.id"
            class="space-publication-card"
            :class="`space-publication-card--${publication.coverTone}`"
            :to="`/space/${space.id}/publication/${publication.id}`"
          >
            <span>{{ publicationTypeLabels[publication.type] }}</span>
            <h3>{{ publication.title }}</h3>
            <p>{{ publication.subtitle }}</p>
            <footer>
              <small>{{ publication.author }}</small>
              <small>{{ publication.duration }}</small>
            </footer>
          </RouterLink>
        </div>
      </section>
    </main>

    <main v-else class="space-detail-page">
      <section class="space-empty-state">
        <h1>Пространство не найдено</h1>
        <RouterLink to="/spaces">Вернуться в каталог</RouterLink>
      </section>
    </main>
  </WorkspaceLayout>
</template>
