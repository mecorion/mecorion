<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import {computed, reactive, ref} from "vue";
import {useRoute, useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {signInWithSeed} from "@/auth/session.js";
import {UiButton, UiForm, UiInput} from "@/components/ui/index.js";

const router = useRouter();
const route = useRoute();
const words = reactive(["", "", "", ""]);
const isSubmitting = ref(false);
const errorMessage = ref("");
const isComplete = computed(() => words.every((word) => word.trim().length > 0));

async function submit() {
  errorMessage.value = "";
  if (!isComplete.value) {
    errorMessage.value = "Введите все четыре слова SeedPhrase";
    return;
  }
  isSubmitting.value = true;
  try {
    await signInWithSeed(words);
    words.fill("");
    await router.replace(typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page auth-page--signin">
    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion"><span class="workspace-brand__mark">M</span><strong>Mecorion</strong></NuxtLink>
      <UiForm class="auth-card" autocomplete="off" :loading="isSubmitting" :error="errorMessage" error-title="Не удалось войти" @submit="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Без пароля</p>
          <h1>Вход по SeedPhrase</h1>
          <p>Введите четыре слова в исходном порядке. Мы не сохраняем их в браузере.</p>
        </div>
        <div class="seed-entry-grid">
          <div v-for="(_, index) in words" :key="index" class="seed-entry">
            <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <UiInput v-model="words[index]" :label="`Слово ${String(index + 1).padStart(2, '0')}`" :aria-label="`Слово ${index + 1}`" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="seed word" />
          </div>
        </div>
        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting" :disabled="!isComplete">Войти</UiButton>
        <div class="auth-secondary-actions">
          <UiButton to="/sign-in" variant="outline">Войти по почте</UiButton>
          <UiButton to="/sign-up" variant="ghost">Зарегистрироваться</UiButton>
        </div>
      </UiForm>
    </section>
    <AuthVisual mode="signin" title="Ваш ключ — только у вас" description="SeedPhrase открывает аккаунт без почты и пароля. Никому не сообщайте её слова." />
  </main>
</template>
