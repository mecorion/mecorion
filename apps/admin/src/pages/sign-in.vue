<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import {AdminApiError} from "~/composables/useAdminApi";

definePageMeta({layout: "auth", title: "Вход"});

const route = useRoute();
const auth = useAdminAuth();
const step = ref<"login" | "words">("login");
const login = ref("admin@mecorion.local");
const challengeId = ref("");
const challengeToken = ref("");
const positions = ref<number[]>([]);
const words = ref(["", "", "", ""]);
const pending = ref(false);
const errorMessage = ref("");

async function submitLogin() {
  errorMessage.value = "";
  pending.value = true;
  try {
    const result = await auth.startSeedChallenge(login.value.trim());
    challengeId.value = result.challengeId;
    challengeToken.value = result.challengeToken;
    positions.value = result.positions;
    words.value = result.positions.map(() => "");
    step.value = "words";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Не удалось начать вход";
  } finally {
    pending.value = false;
  }
}

async function submitWords() {
  errorMessage.value = "";
  pending.value = true;
  try {
    await auth.confirmSeedChallenge({
      login: login.value.trim(),
      challengeId: challengeId.value,
      challengeToken: challengeToken.value,
      words: words.value.map((word) => word.trim()),
    });
    const access = await auth.validateAccess();
    if (access === "forbidden") return navigateTo("/forbidden");
    if (access !== "allowed") throw new Error("Не удалось подтвердить административную сессию");
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await navigateTo(redirect);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) return navigateTo("/forbidden");
    errorMessage.value = error instanceof Error ? error.message : "Не удалось войти";
  } finally {
    pending.value = false;
  }
}

function resetChallenge() {
  step.value = "login";
  challengeId.value = "";
  challengeToken.value = "";
  positions.value = [];
  words.value = ["", "", "", ""];
  errorMessage.value = "";
}
</script>

<template>
  <section class="admin-sign-in">
    <div class="admin-sign-in__visual" aria-hidden="true">
      <div class="admin-sign-in__brand"><span>M</span><strong>Mecorion</strong></div>
      <div class="admin-sign-in__visual-copy">
        <p class="admin-eyebrow">Control Center</p>
        <h1>Управление системой начинается с доверия.</h1>
        <p>Каждое действие администратора проверяется, ограничивается разрешениями и попадает в аудит.</p>
      </div>
      <div class="admin-sign-in__signal"><i></i><span>Защищённый административный контур</span></div>
    </div>

    <div class="admin-sign-in__form-side">
      <UiForm class="admin-sign-in__form" :loading="pending" :error="errorMessage" error-title="Вход не выполнен" @submit="step === 'login' ? submitLogin() : submitWords()">
        <template #header>
          <p class="admin-eyebrow">Только для администраторов</p>
          <h2>{{ step === "login" ? "Войти в Mecorion Admin" : "Подтвердить seed phrase" }}</h2>
          <p class="text-subtitle">{{ step === "login" ? "Введите email или username аккаунта с ролью ADMIN." : "Введите четыре запрошенных слова. Нумерация начинается с первого слова seed phrase." }}</p>
        </template>

        <UiInput v-if="step === 'login'" v-model="login" type="text" label="Логин" autocomplete="username" required placeholder="admin@mecorion.local" />
        <template v-else>
          <UiInput
            v-for="(position, index) in positions"
            :key="position"
            v-model="words[index]"
            type="password"
            :label="`Слово №${position}`"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            pattern="[A-Za-z]+"
            required
            placeholder="word"
          />
        </template>

        <template #actions>
          <UiButton v-if="step === 'words'" variant="ghost" type="button" @click="resetChallenge">Изменить логин</UiButton>
          <UiButton variant="primary" type="submit" :loading="pending">{{ step === "login" ? "Продолжить" : "Войти" }}</UiButton>
        </template>
      </UiForm>
    </div>
  </section>
</template>
