<script setup>
definePageMeta({layout: "auth", authLayout: true, guestOnly: true});
import {computed, reactive, ref} from "vue";
import {useRoute, useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {confirmSeedSignIn, startSeedSignIn} from "@/auth/session.js";
import {UiButton, UiForm, UiInput} from "@/components/ui/index.js";

const router = useRouter();
const route = useRoute();
const step = ref("login");
const login = ref("");
const positions = ref([]);
const challengeId = ref("");
const challengeToken = ref("");
const words = reactive(["", "", "", ""]);
const isSubmitting = ref(false);
const errorMessage = ref("");
const submitted = ref(false);
const touched = reactive([false, false, false, false]);
const wordErrors = computed(() => words.map((word) => {
  const normalized = word.trim();
  if (!normalized) return "Введите слово";
  if (!/^[A-Za-z]+$/.test(normalized)) return "Только латинские буквы";
  return "";
}));
const isComplete = computed(() => wordErrors.value.every((error) => !error));

async function submitLogin() {
  errorMessage.value = "";
  isSubmitting.value = true;
  try {
    const result = await startSeedSignIn(login.value.trim().toLowerCase());
    positions.value = result.positions;
    challengeId.value = result.challengeId;
    challengeToken.value = result.challengeToken;
    words.fill("");
    step.value = "words";
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}

async function submitWords() {
  errorMessage.value = "";
  submitted.value = true;
  if (!isComplete.value) {
    return;
  }
  isSubmitting.value = true;
  try {
    await confirmSeedSignIn({
      login: login.value.trim().toLowerCase(),
      challengeId: challengeId.value,
      challengeToken: challengeToken.value,
      words: words.map((word) => word.trim().toLowerCase()),
    });
    words.fill("");
    await router.replace(typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}

function reset() {
  step.value = "login";
  positions.value = [];
  challengeId.value = "";
  challengeToken.value = "";
  words.fill("");
  errorMessage.value = "";
}
</script>

<template>
  <main class="auth-page auth-page--signin">
    <section class="auth-form-side">
      <NuxtLink class="auth-logo" to="/" aria-label="Mecorion"><span class="workspace-brand__mark">M</span><strong>Mecorion</strong></NuxtLink>
      <UiForm class="auth-card" autocomplete="off" novalidate :loading="isSubmitting" :error="errorMessage" error-title="Не удалось войти" @submit="step === 'login' ? submitLogin() : submitWords()">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Без пароля</p>
          <h1>{{ step === "login" ? "Вход по SeedPhrase" : "Подтвердите слова" }}</h1>
          <p>{{ step === "login" ? "Введите логин Mecorion. Затем мы случайно запросим четыре слова." : "Введите слова с указанных позиций. Они не сохраняются в браузере." }}</p>
        </div>
        <UiInput v-if="step === 'login'" v-model="login" label="Логин" autocomplete="username" required minlength="3" maxlength="254" placeholder="user_name" />
        <div v-else class="seed-entry-grid">
          <div v-for="(_, index) in words" :key="index" class="seed-entry">
            <span aria-hidden="true">{{ String(positions[index]).padStart(2, '0') }}</span>
            <UiInput v-model="words[index]" type="password" :label="`Слово №${positions[index]}`" :aria-label="`Слово №${positions[index]}`" autocomplete="off" autocapitalize="none" spellcheck="false" required pattern="[A-Za-z]+" placeholder="seed word" :error="submitted || touched[index] ? wordErrors[index] : ''" @blur="touched[index] = true" />
          </div>
        </div>
        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting">{{ step === "login" ? "Продолжить" : "Войти" }}</UiButton>
        <div class="auth-secondary-actions">
          <UiButton v-if="step === 'words'" variant="outline" @click="reset">Изменить логин</UiButton>
          <UiButton v-else to="/sign-in" variant="outline">Войти по почте</UiButton>
          <UiButton to="/sign-up" variant="ghost">Зарегистрироваться</UiButton>
        </div>
      </UiForm>
    </section>
    <AuthVisual mode="signin" title="Ваш ключ — только у вас" description="SeedPhrase открывает аккаунт без почты и пароля. Никому не сообщайте её слова." />
  </main>
</template>
