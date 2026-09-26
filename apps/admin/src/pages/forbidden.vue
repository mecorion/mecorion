<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";

definePageMeta({layout: "auth", title: "Доступ запрещён"});
const auth = useAdminAuth();

async function useAnotherAccount() {
  await auth.signOut();
  await navigateTo("/sign-in");
}
</script>

<template>
  <section class="admin-state-page">
    <div class="admin-state-page__icon"><AdminIcon name="shield" /></div>
    <p class="admin-eyebrow">Ошибка 403</p>
    <h1>Недостаточно прав</h1>
    <p class="text-subtitle">Для панели одновременно требуются роль ADMIN и разрешение platform.admin. Обычная регистрация не предоставляет административный доступ.</p>
    <UiButton variant="primary" @click="useAnotherAccount">Войти другим аккаунтом</UiButton>
  </section>
</template>
