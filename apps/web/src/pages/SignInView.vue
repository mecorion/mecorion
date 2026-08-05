<script setup>
import {reactive, ref} from "vue";
import {RouterLink, useRoute, useRouter} from "vue-router";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {signIn} from "@/auth/session.js";

const router = useRouter();
const route = useRoute();
const showPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const form = reactive({
  email: "",
  password: "",
  remember: true,
});

async function submit() {
  errorMessage.value = "";
  isSubmitting.value = true;

  try {
    await signIn({
      email: form.email,
      password: form.password,
    });
    await router.push(typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard");
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
      <RouterLink class="auth-logo" to="/" aria-label="Mecorion">
        <span class="workspace-brand__mark">M</span>
        <strong>Mecorion</strong>
      </RouterLink>

      <form class="auth-card" @submit.prevent="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Вход</p>
          <h1>С возвращением.</h1>
          <p>Войдите, чтобы открыть dashboard и сервисы Mecorion.</p>
        </div>

        <label class="mc-field">
          <span class="mc-field__label">Email</span>
          <input v-model="form.email" class="mc-field__control" type="email" autocomplete="email" placeholder="hello@mecorion.com" />
        </label>

        <label class="mc-field">
          <span class="mc-field__label">Пароль</span>
          <span class="auth-password-field">
            <input
              v-model="form.password"
              class="mc-field__control"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Введите пароль"
            />
            <button type="button" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" @click="showPassword = !showPassword">
              {{ showPassword ? '◉' : '◌' }}
            </button>
          </span>
        </label>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

        <div class="auth-row">
          <label class="mc-checkbox">
            <input v-model="form.remember" type="checkbox" />
            <span>✓</span>
            Запомнить меня
          </label>
          <button class="auth-link" type="button">Забыли пароль?</button>
        </div>

        <button class="mc-button mc-button--primary mc-button--lg auth-submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Входим...' : 'Войти' }}
        </button>

        <div class="auth-divider"><span>или продолжить через</span></div>
        <div class="auth-socials" aria-label="Социальный вход">
          <button type="button" aria-label="Google">G</button>
          <button type="button" aria-label="GitHub">⌘</button>
          <button type="button" aria-label="Yandex">Я</button>
        </div>

        <p class="auth-switch">Нет аккаунта? <RouterLink to="/sign-up">Зарегистрироваться</RouterLink></p>
      </form>
    </section>

    <AuthVisual
      mode="signin"
      title="Ваш контур сервисов уже готов"
      description="Mecorion связывает музыку, видео, книги и облако в одном личном пространстве."
    />
  </main>
</template>
