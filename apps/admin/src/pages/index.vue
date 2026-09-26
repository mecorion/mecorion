<script setup lang="ts">
import UiCard from "@mecorion-ui/UiCard.vue";

definePageMeta({title: "Обзор"});

const auth = useAdminAuth();
const modules = [
  {title: "Пользователи и доступ", description: "Аккаунты, статусы, роли, permissions и сессии.", icon: "users", stage: "Этап 2"},
  {title: "Каталог и публикации", description: "Общий контент, contributors, публикации и дубли.", icon: "boxes", stage: "Этап 3"},
  {title: "Медиа", description: "Загрузки, assets, варианты файлов и обработка.", icon: "play", stage: "Этап 4"},
  {title: "Редакционный процесс", description: "Заявки, review и создание контента.", icon: "git-pull-request", stage: "Этап 5"},
  {title: "Модерация", description: "Жалобы, ограничения и апелляции.", icon: "badge-check", stage: "Этап 6"},
  {title: "Контроль платформы", description: "Legal, library, audit и outbox.", icon: "shield", stage: "Этап 7"},
];
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div>
        <p class="admin-eyebrow">Mecorion Control Center</p>
        <h1 class="text-title">Панель администратора</h1>
        <p class="text-subtitle">Единая точка управления платформой, доступная только подтверждённым администраторам.</p>
      </div>
      <span class="admin-access-state"><i></i>Доступ подтверждён</span>
    </header>

    <section class="admin-access-card mc-card" aria-labelledby="access-title">
      <div class="admin-access-card__icon"><AdminIcon name="shield" /></div>
      <div>
        <p class="text-caption">Текущая сессия</p>
        <h2 id="access-title">{{ auth.session.value?.user.displayName || auth.session.value?.user.username }}</h2>
        <p class="text-body">Роль ADMIN и разрешение platform.admin проверены Mecorion API.</p>
      </div>
      <dl class="admin-access-card__meta">
        <div><dt>Роль</dt><dd>ADMIN</dd></div>
        <div><dt>API</dt><dd>доступен</dd></div>
      </dl>
    </section>

    <section aria-labelledby="modules-title">
      <div class="admin-section-heading">
        <div><p class="text-caption">План внедрения</p><h2 id="modules-title">Модули управления</h2></div>
        <span class="text-caption">Функции добавляются независимыми этапами</span>
      </div>
      <div class="admin-module-grid">
        <UiCard v-for="module in modules" :key="module.title" class="admin-module-card" :title="module.title" :description="module.description">
          <template #action><span class="admin-module-card__icon"><AdminIcon :name="module.icon" /></span></template>
          <span class="admin-module-card__stage">{{ module.stage }}</span>
        </UiCard>
      </div>
    </section>
  </div>
</template>
