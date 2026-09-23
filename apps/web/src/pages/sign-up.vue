<script setup>
definePageMeta({layout: 'auth', authLayout: true, guestOnly: true});
import {reactive, ref} from "vue";
import {useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {signUp} from "@/auth/session.js";
import {UiButton, UiInput} from "@/components/ui/index.js";

const router = useRouter();
const showPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const form = reactive({
  name: "",
  email: "",
  password: "",
  terms: true,
});

async function submit() {
  errorMessage.value = "";

  if (!form.terms) {
    errorMessage.value = "Нужно принять правила Mecorion";
    return;
  }

  isSubmitting.value = true;
  try {
    await signUp({
      displayName: form.name,
      email: form.email,
      password: form.password,
    });
    await router.push("/dashboard");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page auth-page--signup">
    <AuthVisual
      mode="signup"
      title="Создайте свой Mecorion ID"
      description="Один аккаунт откроет доступ к Music и будущим сервисам экосистемы."
    />

    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion">
        <span class="workspace-brand__mark">M</span>
        <strong>Mecorion</strong>
      </NuxtLink>

      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Регистрация</p>
          <h1>Начните с одного аккаунта.</h1>
          <p>Создайте профиль, чтобы пользоваться сервисами Mecorion.</p>
        </div>

        <UiInput v-model="form.name" label="Имя" type="text" autocomplete="name" placeholder="Иван" />

        <UiInput v-model="form.email" label="Email" type="email" autocomplete="email" placeholder="hello@mecorion.com" />

        <label class="mc-field">
          <span class="mc-field__label">Пароль</span>
          <span class="auth-password-field">
            <input
              v-model="form.password"
              class="mc-field__control"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Минимум 8 символов"
            />
            <button type="button" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" @click="showPassword = !showPassword">
              {{ showPassword ? '◉' : '◌' }}
            </button>
          </span>
        </label>

        <label class="mc-checkbox auth-terms">
          <input v-model="form.terms" type="checkbox" />
          <span>✓</span>
          Я принимаю правила Mecorion
        </label>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting">
          {{ isSubmitting ? 'Создаем...' : 'Создать аккаунт' }}
        </UiButton>

        <div class="auth-secondary-actions">
          <UiButton to="/sign-up-seed" variant="outline">Регистрация по SeedPhrase</UiButton>
          <UiButton to="/sign-in" variant="ghost">Войти</UiButton>
        </div>
      </form>
    </section>
  </main>
</template>
