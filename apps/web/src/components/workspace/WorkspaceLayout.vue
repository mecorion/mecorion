<script setup>
import {computed} from "vue";
import {RouterLink, useRoute} from "vue-router";

const route = useRoute();

const currentUser = {
  name: "Вадим",
  initials: "ВД",
  id: "7A3F9C",
};

const primaryNavigation = [
  {title: "Главная", icon: "⌂", route: "/dashboard"},
  {title: "Исследовать", icon: "⌕"},
  {title: "Пространства", icon: "⌘", route: "/spaces"},
  {title: "Сервисы", icon: "▦"},
  {title: "Сохранённое", icon: "▯"},
  {title: "Загрузки", icon: "⇩"},
];

const serviceNavigation = [
  {title: "Music", icon: "♫", route: "/music"},
  {title: "Video", icon: "▻", route: "/home"},
  {title: "Books", icon: "▥"},
  {title: "Drive", icon: "☁"},
  {title: "VPN", icon: "◇"},
  {title: "Agents", icon: "☷"},
];

const communityNavigation = [
  {title: "Resolutions", icon: "⚑"},
  {title: "Requests", icon: "▤"},
];

const accountNavigation = [
  {title: "Профиль", icon: "♙", route: "/profile"},
  {title: "Настройки", icon: "⚙"},
];

const navigationGroups = computed(() => [
  {label: null, items: primaryNavigation, navLabel: "Основное меню"},
  {label: "Сервисы", items: serviceNavigation},
  {label: "Сообщество", items: communityNavigation},
  {label: "Аккаунт", items: accountNavigation},
]);

function isRouteActive(item) {
  if (!item.route) {
    return false;
  }

  return route.path === item.route;
}
</script>

<template>
  <div class="mecorion-workspace dashboard-shell">
    <aside class="dashboard-sidebar" aria-label="Навигация Mecorion">
      <RouterLink class="workspace-brand dashboard-sidebar__brand" to="/dashboard" aria-label="Mecorion dashboard">
        <span class="workspace-brand__mark">M</span>
        <span>Mecorion</span>
      </RouterLink>

      <template v-for="group in navigationGroups" :key="group.label ?? 'primary'">
        <nav v-if="!group.label" class="dashboard-nav" :aria-label="group.navLabel">
          <component
            :is="item.route ? RouterLink : 'button'"
            v-for="item in group.items"
            :key="item.title"
            :to="item.route"
            type="button"
            class="dashboard-nav__item"
            :class="{'dashboard-nav__item--active': isRouteActive(item)}"
          >
            <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
          </component>
        </nav>

        <div v-else class="dashboard-nav-group">
          <p>{{ group.label }}</p>
          <component
            :is="item.route ? RouterLink : 'button'"
            v-for="item in group.items"
            :key="item.title"
            :to="item.route"
            type="button"
            class="dashboard-nav__item"
            :class="{'dashboard-nav__item--active': isRouteActive(item)}"
          >
            <span aria-hidden="true">{{ item.icon }}</span>{{ item.title }}
          </component>
        </div>
      </template>

      <button class="dashboard-sidebar__support" type="button"><span aria-hidden="true">?</span> Помощь и поддержка</button>
    </aside>

    <section class="dashboard-board">
      <header class="dashboard-topbar">
        <label class="dashboard-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Поиск по Mecorion" />
        </label>
        <div class="dashboard-topbar__account">
          <button class="dashboard-icon-button dashboard-icon-button--notice" type="button" aria-label="Уведомления"><span>♧</span><i>3</i></button>
          <button class="dashboard-icon-button" type="button" aria-label="Синхронизация"><span>◌</span></button>
          <RouterLink class="dashboard-user-chip" to="/profile">
            <span>{{ currentUser.initials }}</span>
            <strong>{{ currentUser.name }}</strong>
            <small>Mecorion ID: {{ currentUser.id }}</small>
          </RouterLink>
        </div>
      </header>

      <slot />
    </section>
  </div>
</template>
