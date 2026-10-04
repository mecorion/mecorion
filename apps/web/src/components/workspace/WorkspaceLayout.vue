<script setup>
import {computed, onBeforeUnmount, onMounted, ref, unref, watch} from "vue";
import {useRoute, useRouter} from "#imports";
import {NuxtLink} from "#components";
import SvgIcon from "@/components/SvgIcon.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiButton from "@/components/ui/UiButton.vue";
import WorkspaceSearch from "@/components/workspace/WorkspaceSearch.vue";
import {useAppStore} from "@/stores/app.js";
import {contextNavigation} from "@/navigation/contextNavigation.js";
import {readAuthSession, signOut} from "@/auth/session.js";
import {clearPlatformNavigation, footerNavigationGroups, mainNavigationGroups} from "@/platform/navigation.js";

const route = useRoute();
const router = useRouter();
const app = useAppStore();
const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);
const globalSearchQuery = ref("");

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
const searchConfig = computed(() => unref(contextNavigation.value?.search));
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
  closeSidebar();
}

function activateGlobalSearch() {
  if (route.path.startsWith("/music/")) {
    router.push("/music?section=search");
  }
}

function closeSidebar() {
  isSidebarOpen.value = false;
}

function toggleSidebar() {
  if (window.matchMedia('(max-width: 1180px)').matches) {
    isSidebarOpen.value = !isSidebarOpen.value;
    return;
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function onViewportChange() {
  closeSidebar();
  isSidebarCollapsed.value = false;
}

function onSidebarKeydown(event) {
  if (event.key === "Escape" && isSidebarOpen.value) closeSidebar();
}

onMounted(() => {
  window.matchMedia('(max-width: 1180px)').addEventListener('change', onViewportChange);
  window.addEventListener('keydown', onSidebarKeydown);
});

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
  window.matchMedia('(max-width: 1180px)').removeEventListener('change', onViewportChange);
  window.removeEventListener('keydown', onSidebarKeydown);
});
</script>

<template>
  <div
    class="mecorion-workspace mcrn-shell dashboard-shell"
    :class="{'dashboard-shell--sidebar-collapsed': isSidebarCollapsed, 'dashboard-shell--video': route.path === '/video' || route.path.startsWith('/video/'), 'dashboard-shell--books': route.path === '/books', 'dashboard-shell--music': route.path === '/music' || route.path.startsWith('/music/')}"
    :style="workspaceAccentStyle"
  >
    <UiButton unstyled
      v-if="isSidebarOpen"
      class="mcrn-sidebar-scrim dashboard-sidebar-scrim"
      type="button"
      aria-label="Закрыть меню"
      @click="closeSidebar"
    ></UiButton>

    <aside class="mcrn-sidebar dashboard-sidebar" :class="{'mcrn-sidebar--open dashboard-sidebar--open': isSidebarOpen}" aria-label="Навигация Mecorion">
      <div class="dashboard-sidebar__heading">
        <NuxtLink class="mcrn-brand workspace-brand dashboard-sidebar__brand" to="/dashboard" aria-label="Mecorion dashboard" @click="closeSidebar">
          <span class="mcrn-brand__mark workspace-brand__mark">M</span>
          <span class="mcrn-brand__copy">
            <strong>{{ sidebarTitle }}</strong>
            <small v-if="sidebarSubtitle">{{ sidebarSubtitle }}</small>
          </span>
        </NuxtLink>
        <UiButton unstyled class="dashboard-sidebar__close" aria-label="Закрыть меню" @click="closeSidebar"><SvgIcon name="x" /></UiButton>
      </div>

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
      <header class="mcrn-topbar dashboard-topbar" :class="{'dashboard-topbar--music-search': searchConfig}">
        <UiButton unstyled class="mcrn-icon-button dashboard-menu-button" type="button" aria-label="Переключить меню" @click="toggleSidebar">
          <SvgIcon name="menu" />
        </UiButton>

        <WorkspaceSearch v-if="searchConfig" :config="searchConfig" />
        <UiInput v-else v-model="globalSearchQuery" class="workspace-global-search" size="md" type="search" aria-label="Поиск по Mecorion" placeholder="Поиск по Mecorion" @focus="activateGlobalSearch">
          <template #prefix><SvgIcon name="search" /></template>
          <template #suffix><kbd>⌘K</kbd></template>
        </UiInput>

        <div class="mcrn-topbar__actions dashboard-topbar__account">
          <UiButton unstyled class="mcrn-icon-button dashboard-icon-button dashboard-icon-button--notice" type="button" aria-label="Уведомления">
            <SvgIcon name="bell" />
            <i>3</i>
          </UiButton>
          <UiButton unstyled class="mcrn-icon-button dashboard-icon-button" type="button" aria-label="Переключить тему" @click="app.toggleTheme">
            <SvgIcon name="moon" />
          </UiButton>
          <NuxtLink class="mcrn-user-chip dashboard-user-chip" to="/profile" :aria-label="`Профиль: ${currentUser.name}`" :title="currentUser.name">
            <span class="mcrn-user-chip__avatar">{{ currentUser.initials }}</span>
            <span class="mcrn-user-chip__content">
              <strong>{{ currentUser.name }}</strong>
              <small>Mecorion ID: {{ currentUser.id }}</small>
            </span>
          </NuxtLink>
          <UiButton unstyled class="mcrn-icon-button dashboard-icon-button" type="button" aria-label="Выйти из аккаунта" title="Выйти" @click="logout">
            <SvgIcon name="exit" />
          </UiButton>
        </div>
      </header>

      <slot />
    </section>
  </div>
</template>
