<script setup>
import {computed, onBeforeUnmount, ref, unref, watch} from "vue";
import {useRoute, useRouter} from "#imports";
import {NuxtLink} from "#components";
import SvgIcon from "@/components/SvgIcon.vue";
import {useAppStore} from "@/stores/app.js";
import {contextNavigation} from "@/navigation/contextNavigation.js";
import {readAuthSession, signOut} from "@/auth/session.js";
import {clearPlatformNavigation, footerNavigationGroups, mainNavigationGroups} from "@/platform/navigation.js";

const route = useRoute();
const router = useRouter();
const app = useAppStore();
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

const authenticatedUser = readAuthSession()?.user;
const currentUser = {
  name: authenticatedUser?.displayName || authenticatedUser?.username || "User",
  initials: (authenticatedUser?.displayName || authenticatedUser?.username || "User")
    .split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  id: authenticatedUser?.id?.slice(0, 8).toUpperCase() || "00000000",
};

const navigationGroups = computed(() => contextNavigation.value
  ? unref(contextNavigation.value.groups)
  : mainNavigationGroups.value);
const footerItems = computed(() => contextNavigation.value
  ? []
  : footerNavigationGroups.value.flatMap((group) => group.items));

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

async function logout() {
  await signOut();
  clearPlatformNavigation();
  await router.replace("/sign-in-seed");
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
      <NuxtLink class="mcrn-brand workspace-brand dashboard-sidebar__brand" to="/dashboard" aria-label="Mecorion dashboard">
        <span class="mcrn-brand__mark workspace-brand__mark">M</span>
        <span class="mcrn-brand__copy">
          <strong>{{ sidebarTitle }}</strong>
          <small v-if="sidebarSubtitle">{{ sidebarSubtitle }}</small>
        </span>
      </NuxtLink>

      <template v-for="group in navigationGroups" :key="group.label ?? 'primary'">
        <nav v-if="!group.label" class="mcrn-nav dashboard-nav" :aria-label="group.navLabel">
          <component
            :is="item.route ? NuxtLink : 'button'"
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
            <SvgIcon v-else :name="item.icon" />
            <span class="dashboard-nav__label">{{ item.title }}</span>
          </component>
        </nav>

        <div v-else class="mcrn-nav-group dashboard-nav-group">
          <p class="mcrn-nav-group__label">{{ group.label }}</p>
          <component
            :is="item.route ? NuxtLink : 'button'"
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
            <SvgIcon v-else :name="item.icon" />
            <span class="dashboard-nav__label">{{ item.title }}</span>
          </component>
        </div>

        
      </template>
      <NuxtLink
        v-for="item in footerItems"
        :key="item.code"
        class="sidebar-link dashboard-sidebar__support"
        :to="item.route"
        :data-tooltip="item.title"
      >
        <SvgIcon :name="item.icon" />
        <span class="dashboard-nav__label">{{ item.title }}</span>
      </NuxtLink>
    </aside>

    <section class="dashboard-board">
      <header class="mcrn-topbar dashboard-topbar">
        <button class="mcrn-icon-button dashboard-menu-button" type="button" aria-label="Переключить меню" @click="toggleSidebar">
          <SvgIcon name="menu" />
        </button>

        <label class="mcrn-search dashboard-search">
          <SvgIcon name="search" />
          <input type="search" placeholder="Поиск по Mecorion" />
          <kbd>⌘K</kbd>
        </label>

        <div class="mcrn-topbar__actions dashboard-topbar__account">
          <button class="mcrn-icon-button dashboard-icon-button dashboard-icon-button--notice" type="button" aria-label="Уведомления">
            <SvgIcon name="bell" />
            <i>3</i>
          </button>
          <button class="mcrn-icon-button dashboard-icon-button" type="button" aria-label="Переключить тему" @click="app.toggleTheme">
            <SvgIcon name="moon" />
          </button>
          <NuxtLink class="mcrn-user-chip dashboard-user-chip" to="/profile">
            <span class="mcrn-user-chip__avatar">{{ currentUser.initials }}</span>
            <span class="mcrn-user-chip__content">
              <strong>{{ currentUser.name }}</strong>
              <small>Mecorion ID: {{ currentUser.id }}</small>
            </span>
          </NuxtLink>
          <button class="mcrn-icon-button dashboard-icon-button" type="button" aria-label="Выйти из аккаунта" title="Выйти" @click="logout">
            <SvgIcon name="exit" />
          </button>
        </div>
      </header>

      <slot />
    </section>
  </div>
</template>
