<script setup>
import {useAppStore} from "@/stores/app.js";

const app = useAppStore();

const versions = [
  {
    value: "v1",
    title: "Версия 1",
    label: "Строгий интерфейс",
    description: "Компактные элементы, прямые формы и сдержанные поверхности.",
  },
  {
    value: "v2",
    title: "Версия 2",
    label: "Мягкий интерфейс",
    description: "Больше скруглений, объёма и прозрачных поверхностей.",
  },
];
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
            <h2 id="interface-version-title">Версия оформления</h2>
          </div>
          <div class="mcrn-settings__panel-actions">
            <span class="mcrn-settings__current">Выбрана {{ app.uiVersion }}</span>
            <RouterLink class="mc-button mc-button--soft mc-button--sm" to="/ui-kit">Открыть UI Kit</RouterLink>
          </div>
        </div>

        <div class="mcrn-settings__versions" role="radiogroup" aria-label="Версия интерфейса">
          <label
            v-for="version in versions"
            :key="version.value"
            class="mcrn-settings-option"
            :class="{'mcrn-settings-option--active': app.uiVersion === version.value}"
          >
            <input
              type="radio"
              name="ui-version"
              :value="version.value"
              :checked="app.uiVersion === version.value"
              @change="app.setUiVersion(version.value)"
            >
            <span class="mcrn-settings-option__preview" :class="`mcrn-settings-option__preview--${version.value}`" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span class="mcrn-settings-option__copy">
              <strong>{{ version.title }}</strong>
              <span>{{ version.label }}</span>
              <small>{{ version.description }}</small>
            </span>
            <span class="mcrn-settings-option__check" aria-hidden="true">✓</span>
          </label>
        </div>

        <p class="mcrn-settings__hint">Выбор применяется сразу и сохранится для следующих посещений.</p>
      </section>
    </main>
</template>
