import {computed, ref} from "vue";
import {requestWithSession} from "@/auth/session.js";

const localNavigationGroups = [
  {code: "MAIN", label: null, placement: "MAIN", items: [
    {code: "home", title: "Главная", icon: "home", route: "/dashboard"},
    {code: "explore", title: "Исследовать", icon: "search", route: "/explore"},
    {code: "spaces", title: "Пространства", icon: "boxes", route: "/spaces"},
    {code: "services", title: "Сервисы", icon: "grid", route: "/services"},
    {code: "saved", title: "Сохранённое", icon: "star", route: "/saved"},
    {code: "downloads", title: "Загрузки", icon: "download", route: "/downloads"},
  ]},
  {code: "SERVICES", label: "Сервисы", placement: "MAIN", items: [
    {code: "music", title: "Music", icon: "music", route: "/music"},
    {code: "video", title: "Video", icon: "play", route: "/video"},
    {code: "books", title: "Books", icon: "book", route: "/books"},
    {code: "course", title: "Course", icon: "graduation-cap", route: "/course"},
    {code: "drive", title: "Drive", icon: "cloud", route: "/drive"},
    {code: "vpn", title: "VPN", icon: "shield", route: "/vpn"},
    {code: "agents", title: "Agents", icon: "users", route: "/agents"},
  ]},
  {code: "COMMUNITY", label: "Сообщество", placement: "MAIN", items: [
    {code: "resolutions", title: "Resolutions", icon: "badge-check", route: "/resolutions"},
    {code: "requests", title: "Requests", icon: "git-pull-request", route: "/requests"},
  ]},
  {code: "ACCOUNT", label: "Аккаунт", placement: "MAIN", items: [
    {code: "profile", title: "Профиль", icon: "user", route: "/profile"},
    {code: "settings", title: "Настройки", icon: "settings", route: "/settings"},
  ]},
  {code: "SUPPORT", label: null, placement: "FOOTER", items: [
    {code: "support", title: "Помощь и поддержка", icon: "circle-alert", route: "/support"},
  ]},
];

const groups = ref(import.meta.dev ? localNavigationGroups : []);
const allowedPageCodes = ref(import.meta.dev ? localNavigationGroups.flatMap((group) => group.items.map((item) => item.code)) : []);
let loadedAt = 0;
let loadingPromise = null;

const pathToPageCode = [
  [/^\/dashboard\/?$/, "home"],
  [/^\/explore\/?$/, "explore"],
  [/^\/(spaces|space(?:\/|$))/, "spaces"],
  [/^\/services\/?$/, "services"],
  [/^\/saved\/?$/, "saved"],
  [/^\/downloads\/?$/, "downloads"],
  [/^\/music(?:\/|$)/, "music"],
  [/^\/video(?:\/|$)/, "video"],
  [/^\/books(?:\/|$)/, "books"],
  [/^\/course(?:\/|$)/, "course"],
  [/^\/drive(?:\/|$)/, "drive"],
  [/^\/vpn(?:\/|$)/, "vpn"],
  [/^\/agents(?:\/|$)/, "agents"],
  [/^\/resolutions(?:\/|$)/, "resolutions"],
  [/^\/requests(?:\/|$)/, "requests"],
  [/^\/profile(?:\/|$)/, "profile"],
  [/^\/settings(?:\/|$)/, "settings"],
  [/^\/support(?:\/|$)/, "support"],
];

export const mainNavigationGroups = computed(() => groups.value.filter((group) => group.placement === "MAIN"));
export const footerNavigationGroups = computed(() => groups.value.filter((group) => group.placement === "FOOTER"));

export function pageCodeForPath(path) {
  return pathToPageCode.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}

export function canAccessPage(pageCode) {
  return !pageCode || allowedPageCodes.value.includes(pageCode);
}

export async function loadPlatformNavigation({force = false} = {}) {
  if (!force && loadedAt && Date.now() - loadedAt < 30_000) return {groups: groups.value, allowedPageCodes: allowedPageCodes.value};
  loadingPromise ??= requestWithSession("/api/v1/platform/navigation")
    .then((response) => {
      groups.value = response.groups ?? [];
      allowedPageCodes.value = response.allowedPageCodes ?? [];
      loadedAt = Date.now();
      return response;
    })
    .finally(() => { loadingPromise = null; });
  return loadingPromise;
}

export function clearPlatformNavigation() {
  groups.value = import.meta.dev ? localNavigationGroups : [];
  allowedPageCodes.value = import.meta.dev ? localNavigationGroups.flatMap((group) => group.items.map((item) => item.code)) : [];
  loadedAt = 0;
  loadingPromise = null;
}
