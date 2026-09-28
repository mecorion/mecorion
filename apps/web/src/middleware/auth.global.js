import {initializeAuthSession, isAuthenticated} from "@/auth/session.js";
import {canAccessPage, loadPlatformNavigation, pageCodeForPath} from "@/platform/navigation.js";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;
  await initializeAuthSession();

  if (to.meta.requiresAuth && !isAuthenticated()) {
    return navigateTo({path: "/sign-in-seed", query: {redirect: to.fullPath}});
  }
  if (to.meta.guestOnly && isAuthenticated()) return navigateTo("/dashboard");

  if (to.meta.requiresAuth && isAuthenticated()) {
    await loadPlatformNavigation();
    const pageCode = pageCodeForPath(to.path);
    if (!canAccessPage(pageCode)) {
      throw createError({statusCode: 404, statusMessage: "Страница не найдена"});
    }
  }
});
