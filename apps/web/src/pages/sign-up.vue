<script setup>
definePageMeta({layout: 'auth', authLayout: true, guestOnly: true});
import {reactive, ref} from "vue";
import {useRouter} from "#imports";
import AuthVisual from "@/components/auth/AuthVisual.vue";
import {signUp} from "@/auth/session.js";
import {UiButton, UiCheckbox, UiForm, UiInput} from "@/components/ui/index.js";

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

      <UiForm class="auth-card" :loading="isSubmitting" :error="errorMessage" error-title="Не удалось создать аккаунт" @submit="submit">
        <div class="auth-card__heading">
          <p class="workspace-eyebrow">Регистрация</p>
          <h1>Начните с одного аккаунта.</h1>
          <p>Создайте профиль, чтобы пользоваться сервисами Mecorion.</p>
        </div>

        <UiInput v-model="form.name" label="Имя" type="text" autocomplete="name" placeholder="Иван" />

        <UiInput v-model="form.email" label="Email" type="email" autocomplete="email" placeholder="hello@mecorion.com" />

        <UiInput v-model="form.password" label="Пароль" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Минимум 8 символов">
          <template #suffix><UiButton size="sm" variant="ghost" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" @click="showPassword = !showPassword">{{ showPassword ? 'Скрыть' : 'Показать' }}</UiButton></template>
        </UiInput>

        <UiCheckbox v-model="form.terms" class="auth-terms">Я принимаю правила Mecorion</UiCheckbox>

        <UiButton class="auth-submit" type="submit" variant="primary" size="lg" :loading="isSubmitting">
          {{ isSubmitting ? 'Создаем...' : 'Создать аккаунт' }}
        </UiButton>

        <div class="auth-secondary-actions">
          <UiButton to="/sign-up-seed" variant="outline">Регистрация по SeedPhrase</UiButton>
          <UiButton to="/sign-in" variant="ghost">Войти</UiButton>
        </div>
      </UiForm>
    </section>
  </main>
</template>
