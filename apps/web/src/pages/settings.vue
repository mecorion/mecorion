<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import UiButton from "@/components/ui/UiButton.vue";
</script>

<template>
    <main class="mcrn-settings">
      <header class="mcrn-settings__header">
        <p class="mcrn-settings__eyebrow">Аккаунт</p>
        <h1>Настройки</h1>
        <p>Настройте внешний вид Mecorion под себя.</p>
      </header>

      <section class="mcrn-settings__panel" aria-labelledby="interface-version-title">
        <div class="mcrn-settings__panel-heading">
          <div>
            <p class="mcrn-settings__eyebrow">Интерфейс</p>
            <h2 id="interface-version-title">Mecorion UI</h2>
          </div>
          <div class="mcrn-settings__panel-actions">
            <span class="mcrn-settings__current">Основной интерфейс</span>
            <UiButton size="sm" to="/ui-kit">Открыть UI Kit</UiButton>
          </div>
        </div>

        <p class="mcrn-settings__hint">Компоненты, состояния и правила интерфейса собраны в едином каталоге.</p>
      </section>
    </main>
</template>
