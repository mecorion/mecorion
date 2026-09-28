import {computed, ref} from "vue";
import {requestWithSession} from "@/auth/session.js";

const groups = ref([]);
const allowedPageCodes = ref([]);
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
  groups.value = [];
  allowedPageCodes.value = [];
  loadedAt = 0;
  loadingPromise = null;
}
