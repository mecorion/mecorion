<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {UiButton} from "@/components/ui/index.js";
</script>

<template>
  <main class="auth-page auth-page--signin">
    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion"><span class="workspace-brand__mark">M</span><strong>Mecorion</strong></NuxtLink>
      <section class="auth-card">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Вход по почте</p>
          <h1>Скоро</h1>
          <p>Скоро добавим возможность авторизации по почте. Сейчас используйте защищённый вход по SeedPhrase.</p>
        </div>
        <UiButton to="/sign-in-seed" variant="primary" size="lg">Войти по SeedPhrase</UiButton>
        <UiButton to="/sign-up-seed" variant="outline">Создать аккаунт</UiButton>
      </section>
    </section>
    <AuthVisual mode="signin" title="Один вход для всей экосистемы" description="После входа аккаунт доступен во всех сервисах Mecorion." />
  </main>
</template>
