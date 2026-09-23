<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import {computed, onBeforeUnmount, reactive, ref} from "vue";
import {useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import SecureSeedPhrase from "@/components/auth/SecureSeedPhrase.vue";
import {completeSeedSignUp, signUpWithSeed} from "@/auth/session.js";
import {UiButton, UiCheckbox, UiForm, UiInput} from "@/components/ui/index.js";

const router = useRouter();
const form = reactive({displayName: "", username: ""});
const seedWords = ref([]);
const pendingSession = ref(null);
const confirmed = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const submitted = ref(false);
const touched = reactive({displayName: false, username: false});
const normalizedName = computed(() => form.displayName.trim());
const normalizedUsername = computed(() => form.username.trim());
const rawNameError = computed(() => normalizedName.value && !/^[A-Za-zА-Яа-яЁё]+$/.test(normalizedName.value) ? "Допустимы только кириллические или латинские буквы" : "");
const rawUsernameError = computed(() => {
  if (!normalizedUsername.value) return "Логин обязателен";
  if (!/^[A-Za-z0-9_]+$/.test(normalizedUsername.value)) return "Допустимы только латинские буквы, цифры и _";
  if (normalizedUsername.value.length < 3) return "Логин должен содержать минимум 3 символа";
  if (normalizedUsername.value.length > 32) return "Логин должен содержать не больше 32 символов";
  return "";
});
const nameError = computed(() => submitted.value || touched.displayName ? rawNameError.value : "");
const usernameError = computed(() => submitted.value || touched.username ? rawUsernameError.value : "");
const canSubmit = computed(() => !rawNameError.value && !rawUsernameError.value);

async function submit() {
  errorMessage.value = "";
  submitted.value = true;
  if (!canSubmit.value) return;
  isSubmitting.value = true;
  try {
    const result = await signUpWithSeed({displayName: normalizedName.value, username: normalizedUsername.value});
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

      <UiForm v-if="!seedWords.length" class="auth-card" novalidate :loading="isSubmitting" :error="errorMessage" error-title="Не удалось зарегистрироваться" @submit="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Регистрация</p>
          <h1>Создать аккаунт по SeedPhrase</h1>
          <p>Почта и пароль не понадобятся. Логин будет виден другим пользователям.</p>
        </div>
        <UiInput v-model="form.displayName" label="Ваше имя (необязательно)" autocomplete="name" maxlength="128" pattern="[A-Za-zА-Яа-яЁё]*" placeholder="Иван" :error="nameError" @blur="touched.displayName = true" />
        <UiInput v-model="form.username" label="Ваш логин" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_]+" placeholder="user_name" :error="usernameError" hint="Обязательное поле · от 3 до 32 символов" @blur="touched.username = true" />
        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting">Зарегистрироваться</UiButton>
        <div class="auth-secondary-actions">
          <UiButton to="/sign-up" variant="outline">Регистрация по почте</UiButton>
          <UiButton to="/sign-in" variant="ghost">Войти по почте</UiButton>
        </div>
      </UiForm>

      <div v-else class="auth-card auth-card--seed-result">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Ваш ключ доступа</p>
          <h1>Сохраните SeedPhrase</h1>
          <p>Она показывается только сейчас. Mecorion не сможет восстановить её за вас.</p>
        </div>
        <SecureSeedPhrase :words="seedWords" />
        <UiCheckbox v-model="confirmed" class="auth-seed-confirm">Я записал SeedPhrase и понимаю, что без неё потеряю доступ</UiCheckbox>
        <UiButton variant="primary" size="lg" :disabled="!confirmed" @click="finish">Продолжить</UiButton>
      </div>
    </section>
  </main>
</template>
