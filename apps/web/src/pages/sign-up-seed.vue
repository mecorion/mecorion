<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import {computed, onBeforeUnmount, reactive, ref} from "vue";
import {useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import SecureSeedPhrase from "@/components/auth/SecureSeedPhrase.vue";
import {completeSeedSignUp, signUpWithSeed} from "@/auth/session.js";
import {UiButton, UiInput} from "@/components/ui/index.js";

const router = useRouter();
const form = reactive({displayName: "", username: ""});
const seedWords = ref([]);
const pendingSession = ref(null);
const confirmed = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const nameError = computed(() => form.displayName && !/^[A-Za-zА-Яа-яЁё\s-]+$/.test(form.displayName) ? "Только кириллица или латиница" : "");
const usernameError = computed(() => form.username && !/^[A-Za-z0-9_]+$/.test(form.username) ? "Используйте латинские буквы, цифры и _" : "");
const canSubmit = computed(() => form.username.length >= 3 && !nameError.value && !usernameError.value);

async function submit() {
  errorMessage.value = "";
  if (!canSubmit.value) return;
  isSubmitting.value = true;
  try {
    const result = await signUpWithSeed({...form});
    seedWords.value = result.seedPhrase.split(/\s+/);
    pendingSession.value = result;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}

async function finish() {
  completeSeedSignUp(pendingSession.value);
  pendingSession.value = null;
  seedWords.value = [];
  await router.replace("/dashboard");
}

onBeforeUnmount(() => {
  seedWords.value = [];
  pendingSession.value = null;
});
</script>

<template>
  <main class="auth-page auth-page--signup auth-page--seed-signup">
    <AuthVisual mode="signup" title="Аккаунт без почты" description="Ваш доступ защищает уникальная SeedPhrase. Mecorion покажет её только один раз." />
    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion"><span class="workspace-brand__mark">M</span><strong>Mecorion</strong></NuxtLink>

      <form v-if="!seedWords.length" class="auth-card" @submit.prevent="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Регистрация</p>
          <h1>Создать аккаунт по SeedPhrase</h1>
          <p>Почта и пароль не понадобятся. Логин будет виден другим пользователям.</p>
        </div>
        <UiInput v-model="form.displayName" label="Ваше имя (необязательно)" autocomplete="name" placeholder="Иван" :error="nameError" />
        <UiInput v-model="form.username" label="Ваш логин" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="user_name" :error="usernameError" hint="От 3 до 32 символов" />
        <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting" :disabled="!canSubmit">Зарегистрироваться</UiButton>
        <div class="auth-secondary-actions">
          <UiButton to="/sign-up" variant="outline">Регистрация по почте</UiButton>
          <UiButton to="/sign-in" variant="ghost">Войти по почте</UiButton>
        </div>
      </form>

      <div v-else class="auth-card auth-card--seed-result">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Ваш ключ доступа</p>
          <h1>Сохраните SeedPhrase</h1>
          <p>Она показывается только сейчас. Mecorion не сможет восстановить её за вас.</p>
        </div>
        <SecureSeedPhrase :words="seedWords" />
        <label class="mc-checkbox auth-seed-confirm">
          <input v-model="confirmed" type="checkbox" /><span>✓</span>Я записал SeedPhrase и понимаю, что без неё потеряю доступ
        </label>
        <UiButton variant="primary" size="lg" :disabled="!confirmed" @click="finish">Продолжить</UiButton>
      </div>
    </section>
  </main>
</template>
