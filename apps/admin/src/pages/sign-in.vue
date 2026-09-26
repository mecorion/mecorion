<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import {AdminApiError} from "~/composables/useAdminApi";

definePageMeta({layout: "auth", title: "Вход"});

const route = useRoute();
const auth = useAdminAuth();
const step = ref<"email" | "code">("email");
const email = ref("");
const code = ref("");
const devCode = ref("");
const pending = ref(false);
const errorMessage = ref("");

async function submitEmail() {
  errorMessage.value = "";
  pending.value = true;
  try {
    const result = await auth.startEmailSignIn(email.value.trim());
    devCode.value = result.devCode ?? "";
    step.value = "code";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Не удалось отправить код";
  } finally {
    pending.value = false;
  }
}

async function submitCode() {
  errorMessage.value = "";
  pending.value = true;
  try {
    await auth.confirmEmailSignIn(email.value.trim(), code.value.trim());
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
      <UiForm class="admin-sign-in__form" :loading="pending" :error="errorMessage" error-title="Вход не выполнен" @submit="step === 'email' ? submitEmail() : submitCode()">
        <template #header>
          <p class="admin-eyebrow">Только для администраторов</p>
          <h2>{{ step === "email" ? "Войти в Mecorion Admin" : "Подтвердить вход" }}</h2>
          <p class="text-subtitle">{{ step === "email" ? "Используйте email зарегистрированного аккаунта с ролью ADMIN." : `Код отправлен на ${email}` }}</p>
        </template>

        <UiInput v-if="step === 'email'" v-model="email" type="email" label="Email" autocomplete="email" required placeholder="admin@example.com" />
        <UiInput v-else v-model="code" type="text" label="Код подтверждения" autocomplete="one-time-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required placeholder="000000" />

        <p v-if="devCode" class="admin-dev-code">Dev-код: <strong>{{ devCode }}</strong></p>

        <template #actions>
          <UiButton v-if="step === 'code'" variant="ghost" type="button" @click="step = 'email'; code = ''; devCode = ''">Изменить email</UiButton>
          <UiButton variant="primary" type="submit" :loading="pending">{{ step === "email" ? "Получить код" : "Войти" }}</UiButton>
        </template>
      </UiForm>
    </div>
  </section>
</template>
