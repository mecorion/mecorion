export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client || to.path === "/sign-in" || to.path === "/forbidden") return;

  const auth = useAdminAuth();
  const access = await auth.validateAccess();

  if (access === "unauthenticated") {
    return navigateTo({path: "/sign-in", query: {redirect: to.fullPath}});
  }
  if (access === "forbidden") return navigateTo("/forbidden");
});
