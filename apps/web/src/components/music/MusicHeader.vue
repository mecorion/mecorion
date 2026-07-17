<script setup>
defineProps({
  query: {type: String, required: true},
});

const emit = defineEmits(["update:query", "focus-search"]);
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
      <button class="memusic-icon-button" type="button" aria-label="Уведомления">◌<i></i></button>
      <button class="memusic-profile" type="button"><span>ВД</span><strong>Вадим</strong></button>
    </div>
  </header>
</template>
