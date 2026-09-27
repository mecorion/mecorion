<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {UiButton} from "@/components/ui/index.js";
</script>

<template>
  <main class="auth-page auth-page--signup">
    <AuthVisual mode="signup" title="Единый Mecorion ID" description="Один аккаунт открывает Music, Video, Books, Course и другие сервисы." />
    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion"><span class="workspace-brand__mark">M</span><strong>Mecorion</strong></NuxtLink>
      <section class="auth-card">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Регистрация по почте</p>
          <h1>Скоро</h1>
          <p>Скоро добавим возможность регистрации по почте. Сейчас аккаунт создаётся по SeedPhrase.</p>
        </div>
        <UiButton to="/sign-up-seed" variant="primary" size="lg">Регистрация по SeedPhrase</UiButton>
        <UiButton to="/sign-in-seed" variant="outline">Уже есть аккаунт</UiButton>
      </section>
    </section>
  </main>
</template>
