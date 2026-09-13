<script setup>
import {computed, onBeforeUnmount, ref, unref, watch} from "vue";
import {RouterLink, useRoute} from "vue-router";
import {useAppStore} from "@/stores/app.js";
import {contextNavigation} from "@/navigation/contextNavigation.js";

const route = useRoute();
const app = useAppStore();
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

const currentUser = {
  name: "Иван",
  initials: "ИИ",
  id: "000000",
};

const primaryNavigation = [
  {title: "Главная", icon: "home", route: "/dashboard"},
  {title: "Исследовать", icon: "search"},
  {title: "Пространства", icon: "boxes", route: "/spaces"},
  {title: "Сервисы", icon: "grid"},
  {title: "Сохранённое", icon: "star"},
  {title: "Загрузки", icon: "download"},
];

const serviceNavigation = [
  {title: "Music", icon: "music", route: "/music"},
  {title: "Video", icon: "play", route: "/video"},
  {title: "Books", icon: "book", route: "/books"},
  {title: "Course", icon: "graduationCap", route: "/course"},
  {title: "Drive", icon: "cloud"},
  {title: "VPN", icon: "shield"},
  {title: "Agents", icon: "users"},
];

const communityNavigation = [
  {title: "Resolutions", icon: "badgeCheck"},
  {title: "Requests", icon: "gitPull"},
];

const accountNavigation = [
  {title: "Профиль", icon: "user", route: "/profile"},
  {title: "Настройки", icon: "settings", route: "/settings"},
];

const platformNavigationGroups = [
  {label: null, items: primaryNavigation, navLabel: "Основное меню"},
  {label: "Сервисы", items: serviceNavigation},
  {label: "Сообщество", items: communityNavigation},
  {label: "Аккаунт", items: accountNavigation},
];

const navigationGroups = computed(() => contextNavigation.value
  ? unref(contextNavigation.value.groups)
  : platformNavigationGroups);

const sidebarTitle = computed(() => contextNavigation.value?.title ?? "Mecorion");
const sidebarSubtitle = computed(() => contextNavigation.value?.subtitle ?? null);
const workspaceAccentStyle = computed(() => {
  const accent = contextNavigation.value?.accent;

  if (!accent) {
    return undefined;
  }

  return {
    "--mc-accent": accent,
    "--mc-accent-strong": contextNavigation.value.accentStrong ?? accent,
    "--mc-accent-contrast": contextNavigation.value.accentContrast ?? "#17152b",
  };
});

function isRouteActive(item) {
  if (item.active !== undefined) {
    return unref(item.active);
  }

  if (item.id && contextNavigation.value) {
    return unref(contextNavigation.value.activeId) === item.id;
  }
  if (!item.route) {
    return false;
  }

  if (item.route === "/spaces") {
    return route.path === "/spaces" || route.path.startsWith("/space/");
  }

  if (item.route === "/books") {
    return route.path === "/books";
  }

  return route.path === item.route;
}

function activateNavigationItem(item) {
  item.action?.();
}

// Небольшой локальный набор outline-иконок в духе Lucide. Его легко заменить
// на lucide-vue-next, когда зависимость появится в проекте.
const iconPaths = {
  badgeCheck: [["path", {d: "M7.5 7.5 10 10l4.5-5"}], ["path", {d: "M12 2.5 14.6 4l3 .1 1.5 2.6 2.4 1.6-.7 2.9.7 2.9-2.4 1.6-1.5 2.6-3 .1-2.6 1.5L9.4 19l-3-.1-1.5-2.6-2.4-1.6.7-2.9-.7-2.9 2.4-1.6L6.4 4l3-.1L12 2.5Z"}]],
  bell: [["path", {d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"}], ["path", {d: "M13.7 21a2 2 0 0 1-3.4 0"}]],
  book: [["path", {d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"}], ["path", {d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"}]],
  boxes: [["path", {d: "m7.5 4.3 4.5 2.6 4.5-2.6"}], ["path", {d: "M12 7v5"}], ["path", {d: "m3 8 4.5 2.6L12 8l4.5 2.6L21 8"}], ["path", {d: "M3 8v8l4.5 2.6V10.6Z"}], ["path", {d: "m12 8 4.5 2.6v8L12 16Z"}], ["path", {d: "M21 8v8l-4.5 2.6v-8Z"}]],
  cloud: [["path", {d: "M17.5 18H7a5 5 0 1 1 1.1-9.9A6.5 6.5 0 0 1 20 11.5a3.5 3.5 0 0 1-2.5 6.5Z"}]],
  download: [["path", {d: "M12 3v12"}], ["path", {d: "m7 10 5 5 5-5"}], ["path", {d: "M5 21h14"}]],
  filter: [["path", {d: "M3 5h18"}], ["path", {d: "M6 12h12"}], ["path", {d: "M10 19h4"}]],
  gitPull: [["circle", {cx: "18", cy: "18", r: "3"}], ["circle", {cx: "6", cy: "6", r: "3"}], ["path", {d: "M6 9v12"}], ["path", {d: "M18 15V9a3 3 0 0 0-3-3h-2"}]],
  grid: [["rect", {x: "3", y: "3", width: "7", height: "7", rx: "1"}], ["rect", {x: "14", y: "3", width: "7", height: "7", rx: "1"}], ["rect", {x: "14", y: "14", width: "7", height: "7", rx: "1"}], ["rect", {x: "3", y: "14", width: "7", height: "7", rx: "1"}]],
  graduationCap: [["path", {d: "M22 10 12 5 2 10l10 5 10-5Z"}], ["path", {d: "M6 12.5V17c3.2 2 8.8 2 12 0v-4.5"}], ["path", {d: "M22 10v6"}]],
  home: [["path", {d: "m3 10.5 9-7 9 7"}], ["path", {d: "M5 9.5V21h14V9.5"}], ["path", {d: "M9 21v-6h6v6"}]],
  menu: [["path", {d: "M4 6h16"}], ["path", {d: "M4 12h16"}], ["path", {d: "M4 18h16"}]],
  moon: [["path", {d: "M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"}]],
  music: [["path", {d: "M9 18V5l12-2v13"}], ["circle", {cx: "6", cy: "18", r: "3"}], ["circle", {cx: "18", cy: "16", r: "3"}]],
  play: [["path", {d: "m8 5 12 7-12 7V5Z"}]],
  search: [["circle", {cx: "11", cy: "11", r: "7"}], ["path", {d: "m21 21-4.3-4.3"}]],
  settings: [["path", {d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"}], ["path", {d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"}]],
  shield: [["path", {d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"}]],
  star: [["path", {d: "m12 2 3 6 6.5.9-4.7 4.6 1.1 6.5-5.9-3.1L6.1 20l1.1-6.5L2.5 8.9 9 8Z"}]],
  user: [["path", {d: "M19 21a7 7 0 0 0-14 0"}], ["circle", {cx: "12", cy: "7", r: "4"}]],
  users: [["path", {d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}], ["circle", {cx: "9", cy: "7", r: "4"}], ["path", {d: "M22 21v-2a4 4 0 0 0-3-3.9"}], ["path", {d: "M16 3.1a4 4 0 0 1 0 7.8"}]],
};

function closeSidebar() {
  isSidebarOpen.value = false;
}

function toggleSidebar() {
  if (window.matchMedia('(max-width: 860px)').matches) {
    isSidebarOpen.value = !isSidebarOpen.value;
    return;
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

watch(() => route.path, closeSidebar);

watch(isSidebarOpen, (isOpen) => {
  document.documentElement.classList.toggle("mcrn-menu-open", isOpen);
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("mcrn-menu-open");
});
</script>

<template>
  <div
    class="mecorion-workspace mcrn-shell dashboard-shell"
    :class="{'dashboard-shell--sidebar-collapsed': isSidebarCollapsed}"
    :style="workspaceAccentStyle"
  >
    <button
      v-if="isSidebarOpen"
      class="mcrn-sidebar-scrim dashboard-sidebar-scrim"
      type="button"
      aria-label="Закрыть меню"
      @click="closeSidebar"
    ></button>

    <aside class="mcrn-sidebar dashboard-sidebar" :class="{'mcrn-sidebar--open dashboard-sidebar--open': isSidebarOpen}" aria-label="Навигация Mecorion">
      <RouterLink class="mcrn-brand workspace-brand dashboard-sidebar__brand" to="/dashboard" aria-label="Mecorion dashboard">
        <span class="mcrn-brand__mark workspace-brand__mark">M</span>
        <span class="mcrn-brand__copy">
          <strong>{{ sidebarTitle }}</strong>
          <small v-if="sidebarSubtitle">{{ sidebarSubtitle }}</small>
        </span>
      </RouterLink>

      <template v-for="group in navigationGroups" :key="group.label ?? 'primary'">
        <nav v-if="!group.label" class="mcrn-nav dashboard-nav" :aria-label="group.navLabel">
          <component
            :is="item.route ? RouterLink : 'button'"
            v-for="item in group.items"
            :key="item.title"
            :to="item.route"
            type="button"
            class="sidebar-link dashboard-nav__item"
            :data-tooltip="item.title"
            :class="{'active sidebar-link--active dashboard-nav__item--active': isRouteActive(item)}"
            @click="activateNavigationItem(item)"
          >
            <span v-if="item.symbol" class="dashboard-nav__symbol" aria-hidden="true">{{ item.symbol }}</span>
            <svg v-else aria-hidden="true" viewBox="0 0 24 24">
              <component
                :is="path[0]"
                v-for="(path, index) in iconPaths[item.icon]"
                :key="`${item.icon}-${index}`"
                v-bind="path[1]"
              />
            </svg>
            <span class="dashboard-nav__label">{{ item.title }}</span>
          </component>
        </nav>

        <div v-else class="mcrn-nav-group dashboard-nav-group">
          <p class="mcrn-nav-group__label">{{ group.label }}</p>
          <component
            :is="item.route ? RouterLink : 'button'"
            v-for="item in group.items"
            :key="item.title"
            :to="item.route"
            type="button"
            class="sidebar-link dashboard-nav__item"
            :data-tooltip="item.title"
            :class="{'active sidebar-link--active dashboard-nav__item--active': isRouteActive(item)}"
            @click="activateNavigationItem(item)"
          >
            <span v-if="item.symbol" class="dashboard-nav__symbol" aria-hidden="true">{{ item.symbol }}</span>
            <svg v-else aria-hidden="true" viewBox="0 0 24 24">
              <component
                :is="path[0]"
                v-for="(path, index) in iconPaths[item.icon]"
                :key="`${item.icon}-${index}`"
                v-bind="path[1]"
              />
            </svg>
            <span class="dashboard-nav__label">{{ item.title }}</span>
          </component>
        </div>
      </template>

      <RouterLink v-if="contextNavigation" class="sidebar-link dashboard-sidebar__support" to="/dashboard" data-tooltip="Все сервисы">
        <span aria-hidden="true">←</span>
        <span class="dashboard-nav__label">Все сервисы</span>
      </RouterLink>
      <button v-else class="sidebar-link dashboard-sidebar__support" type="button" data-tooltip="Помощь и поддержка">
        <span aria-hidden="true">?</span>
        <span class="dashboard-nav__label">Помощь и поддержка</span>
      </button>
    </aside>

    <section class="dashboard-board">
      <header class="mcrn-topbar dashboard-topbar">
        <button class="mcrn-icon-button dashboard-menu-button" type="button" aria-label="Переключить меню" @click="toggleSidebar">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <component
              :is="path[0]"
              v-for="(path, index) in iconPaths.menu"
              :key="`menu-${index}`"
              v-bind="path[1]"
            />
          </svg>
        </button>

        <label class="mcrn-search dashboard-search">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <component
              :is="path[0]"
              v-for="(path, index) in iconPaths.search"
              :key="`search-${index}`"
              v-bind="path[1]"
            />
          </svg>
          <input type="search" placeholder="Поиск по Mecorion" />
          <kbd>⌘K</kbd>
        </label>

        <div class="mcrn-topbar__actions dashboard-topbar__account">
          <button class="mcrn-icon-button dashboard-icon-button dashboard-icon-button--notice" type="button" aria-label="Уведомления">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <component
                :is="path[0]"
                v-for="(path, index) in iconPaths.bell"
                :key="`bell-${index}`"
                v-bind="path[1]"
              />
            </svg>
            <i>3</i>
          </button>
          <button class="mcrn-icon-button dashboard-icon-button" type="button" aria-label="Переключить тему" @click="app.toggleTheme">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <component
                :is="path[0]"
                v-for="(path, index) in iconPaths.moon"
                :key="`moon-${index}`"
                v-bind="path[1]"
              />
            </svg>
          </button>
          <RouterLink class="mcrn-user-chip dashboard-user-chip" to="/profile">
            <span class="mcrn-user-chip__avatar">{{ currentUser.initials }}</span>
            <span class="mcrn-user-chip__content">
              <strong>{{ currentUser.name }}</strong>
              <small>Mecorion ID: {{ currentUser.id }}</small>
            </span>
          </RouterLink>
        </div>
      </header>

      <slot />
    </section>
  </div>
</template>
