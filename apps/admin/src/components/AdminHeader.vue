<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";

const emit = defineEmits<{menu: []}>();
const auth = useAdminAuth();
const theme = useAdminTheme();
const signingOut = ref(false);

const initials = computed(() => {
  const value = auth.session.value?.user.displayName || auth.session.value?.user.username || "Admin";
  return value.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
});

async function logout() {
  signingOut.value = true;
  try {
    await auth.signOut();
    await navigateTo("/sign-in");
  } finally {
    signingOut.value = false;
  }
}
</script>

<template>
  <header class="admin-header">
    <UiButton class="admin-header__menu" variant="ghost" icon aria-label="Открыть меню" @click="emit('menu')">
      <AdminIcon name="menu" />
    </UiButton>

    <div class="admin-header__context">
      <span class="text-caption">Управление платформой</span>
      <strong>{{ $route.meta.title || "Обзор" }}</strong>
    </div>

    <div class="admin-header__actions">
      <UiButton variant="ghost" icon :aria-label="theme.theme.value === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'" @click="theme.toggle">
        <AdminIcon :name="theme.theme.value === 'dark' ? 'sun' : 'moon'" />
      </UiButton>
      <div class="admin-profile">
        <span class="admin-profile__avatar">{{ initials }}</span>
        <span class="admin-profile__copy">
          <strong>{{ auth.session.value?.user.displayName || auth.session.value?.user.username }}</strong>
          <small>ADMIN</small>
        </span>
      </div>
      <UiButton variant="ghost" icon :loading="signingOut" aria-label="Выйти" @click="logout">
        <AdminIcon name="exit" />
      </UiButton>
    </div>
  </header>
</template>
