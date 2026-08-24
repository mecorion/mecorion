<script setup>
import {computed, ref} from "vue";
import {RouterLink, useRoute} from "vue-router";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";
import {
  getPublicationById,
  getSpaceBreadcrumb,
  getSpaceById,
  publicationTypeLabels,
} from "@/spaces/spaces.mock.js";

const route = useRoute();
const selectedQuality = ref("1080p");
const selectedSubtitles = ref("Русские");
const selectedVoice = ref("Оригинал");

const publication = computed(() => getPublicationById(route.params.id));
const space = computed(() => publication.value ? getSpaceById(publication.value.spaceId) : null);
const breadcrumb = computed(() => publication.value ? getSpaceBreadcrumb(publication.value) : "");
</script>

<template>
  <WorkspaceLayout>
    <main v-if="publication && space" class="publication-page">
      <nav class="mcrn-route-path" aria-label="Путь">
        <RouterLink to="/spaces">/</RouterLink>
        <RouterLink :to="`/space/${space.id}`">{{ space.title }}</RouterLink>
        <span aria-current="page">{{ publication.title }}</span>
      </nav>

      <RouterLink class="space-back-link" :to="`/space/${space.id}`">← {{ space.title }}</RouterLink>

      <section class="publication-hero">
        <article class="publication-cover" :class="`space-publication-card--${publication.coverTone}`">
          <span>{{ publicationTypeLabels[publication.type] }}</span>
          <strong>{{ publication.title }}</strong>
        </article>

        <div class="publication-summary">
          <p class="workspace-eyebrow">{{ breadcrumb }}</p>
          <h1>{{ publication.title }}</h1>
          <p>{{ publication.subtitle }}</p>
          <dl>
            <div><dt>Автор</dt><dd>{{ publication.author }}</dd></div>
            <div><dt>Год</dt><dd>{{ publication.year }}</dd></div>
            <div><dt>Объём</dt><dd>{{ publication.duration }}</dd></div>
          </dl>
          <div class="publication-actions">
            <button type="button">Добавить в библиотеку</button>
            <button type="button">Поделиться</button>
          </div>
        </div>
      </section>

      <section v-if="publication.video" class="publication-panel">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Видео-параметры</p>
            <h2>Просмотр</h2>
          </div>
        </div>
        <div class="publication-settings-grid">
          <label>
            <span>Качество</span>
            <select v-model="selectedQuality">
              <option v-for="quality in publication.video.quality" :key="quality">{{ quality }}</option>
            </select>
          </label>
          <label>
            <span>Субтитры</span>
            <select v-model="selectedSubtitles">
              <option v-for="subtitle in publication.video.subtitles" :key="subtitle">{{ subtitle }}</option>
            </select>
          </label>
          <label>
            <span>Озвучка</span>
            <select v-model="selectedVoice">
              <option v-for="voice in publication.video.voice" :key="voice">{{ voice }}</option>
            </select>
          </label>
        </div>
      </section>

      <section v-if="publication.items?.length" class="publication-panel">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Состав</p>
            <h2>Материалы сборника</h2>
          </div>
        </div>
        <ol class="publication-item-list">
          <li v-for="item in publication.items" :key="item">{{ item }}</li>
        </ol>
      </section>

      <section class="publication-panel">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Описание</p>
            <h2>О публикации</h2>
          </div>
        </div>
        <p class="publication-body">{{ publication.body }}</p>
      </section>

      <section class="publication-panel">
        <div class="space-section-header">
          <div>
            <p class="workspace-eyebrow">Обсуждение</p>
            <h2>Комментарии</h2>
          </div>
          <button type="button">Написать комментарий</button>
        </div>
        <div class="publication-comments">
          <article v-for="comment in publication.comments" :key="`${comment.author}-${comment.time}`">
            <strong>{{ comment.author }}</strong>
            <p>{{ comment.text }}</p>
            <small>{{ comment.time }}</small>
          </article>
          <p v-if="!publication.comments.length" class="publication-empty-comments">Пока нет комментариев.</p>
        </div>
      </section>
    </main>

    <main v-else class="publication-page">
      <section class="space-empty-state">
        <h1>Публикация не найдена</h1>
        <RouterLink to="/spaces">Вернуться в пространства</RouterLink>
      </section>
    </main>
  </WorkspaceLayout>
</template>
