<script setup>
import {useAppStore} from "@/stores/app.js";

defineProps({
  query: {type: String, required: true},
});

const emit = defineEmits(["update:query", "focus-search"]);
const app = useAppStore();
</script>

<template>
  <header class="memusic-header">
    <label class="memusic-search">
      <span aria-hidden="true">⌕</span>
      <input
        :value="query"
        type="search"
        placeholder="Треки, исполнители и альбомы"
        @focus="emit('focus-search')"
        @input="emit('update:query', $event.target.value)"
      />
      <button v-if="query" type="button" aria-label="Очистить поиск" @click="emit('update:query', '')">×</button>
    </label>

    <div class="memusic-header__actions">
      <button class="mcrn-header-icon memusic-icon-button" type="button" aria-label="Сменить тему" @click="app.toggleTheme()">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>
      <button class="mcrn-header-icon mcrn-header-icon--notify memusic-icon-button" type="button" aria-label="Уведомления">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.27 21a2 2 0 0 0 3.46 0" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        </svg>
        <i aria-hidden="true"></i>
      </button>
      <button class="mcrn-header-profile memusic-profile" type="button" aria-label="Открыть профиль">
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <strong>Иван</strong>
      </button>
    </div>
  </header>
</template>
