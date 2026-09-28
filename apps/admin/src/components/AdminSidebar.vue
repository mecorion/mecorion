<script setup lang="ts">
const route = useRoute();
const emit = defineEmits<{navigate: []}>();

const groups = [
  {
    label: "Платформа",
    items: [
      {label: "Обзор", icon: "home", to: "/", ready: true},
      {label: "Пользователи", icon: "users", to: "/users", ready: true},
      {label: "Роли и доступ", icon: "shield", to: "/access", ready: true},
      {label: "Управление Mecorion", icon: "settings", to: "/platform", ready: true},
    ],
  },
  {
    label: "Контент",
    items: [
      {label: "Каталог", icon: "boxes", to: "/content", ready: true},
      {label: "Публикации", icon: "book", to: "/publications", ready: true},
      {label: "Медиа", icon: "play", to: "/media", ready: true},
      {label: "Заявки", icon: "git-pull-request", to: "/workflow", ready: true},
    ],
  },
  {
    label: "Контроль",
    items: [
      {label: "Модерация", icon: "badge-check", to: "/moderation", ready: true},
      {label: "Правовые статусы", icon: "circle-alert", to: "/legal", ready: true},
      {label: "Библиотека", icon: "book", to: "/library", ready: true},
      {label: "Аудит", icon: "list-music", to: "/audit", ready: true},
      {label: "Системные события", icon: "cloud", to: "/outbox", ready: true},
    ],
  },
];

function isActive(path: string) {
  return path === "/" ? route.path === "/" : route.path.startsWith(path);
}
</script>

<template>
  <aside class="admin-sidebar" aria-label="Навигация панели администратора">
    <NuxtLink class="admin-brand" to="/" @click="emit('navigate')">
      <span class="admin-brand__mark" aria-hidden="true">M</span>
      <span class="admin-brand__copy"><strong>Mecorion</strong><small>Admin</small></span>
    </NuxtLink>

    <nav class="admin-nav mc-scroll">
      <section v-for="group in groups" :key="group.label" class="admin-nav__group">
        <p class="admin-nav__label">{{ group.label }}</p>
        <template v-for="item in group.items" :key="item.to">
          <NuxtLink
            v-if="item.ready"
            class="sidebar-link"
            :class="{'active': isActive(item.to)}"
            :to="item.to"
            @click="emit('navigate')"
          >
            <AdminIcon :name="item.icon" />
            <span>{{ item.label }}</span>
          </NuxtLink>
          <span v-else class="sidebar-link sidebar-link--planned" aria-disabled="true">
            <AdminIcon :name="item.icon" />
            <span>{{ item.label }}</span>
            <small>скоро</small>
          </span>
        </template>
      </section>
    </nav>

    <div class="admin-sidebar__footer">
      <span class="admin-environment"><i></i>API: apps/api</span>
      <span class="text-caption">Управление платформой</span>
    </div>
  </aside>
</template>
