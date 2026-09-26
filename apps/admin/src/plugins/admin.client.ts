import "virtual:svg-icons-register";

export default defineNuxtPlugin(() => {
  useAdminTheme().initialize();
  useAdminAuth().hydrate();
});
