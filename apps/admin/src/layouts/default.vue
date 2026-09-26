<script setup lang="ts">
const menuOpen = ref(false);

watch(menuOpen, (value) => {
  if (!import.meta.client) return;
  document.documentElement.classList.toggle("mcrn-menu-open", value);
});

onBeforeUnmount(() => {
  if (import.meta.client) document.documentElement.classList.remove("mcrn-menu-open");
});
</script>

<template>
  <div class="admin-shell" :class="{'admin-shell--menu-open': menuOpen}">
    <button class="admin-shell__overlay" type="button" aria-label="Закрыть меню" @click="menuOpen = false"></button>
    <AdminSidebar @navigate="menuOpen = false" />
    <div class="admin-shell__workspace">
      <AdminHeader @menu="menuOpen = true" />
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>
