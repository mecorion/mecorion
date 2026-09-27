import {initializeAuthSession, isAuthenticated} from "@/auth/session.js";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return;
  await initializeAuthSession();

  if (to.meta.requiresAuth && !isAuthenticated()) {
    return navigateTo({path: "/sign-in-seed", query: {redirect: to.fullPath}});
  }
  if (to.meta.guestOnly && isAuthenticated()) return navigateTo("/dashboard");
});
