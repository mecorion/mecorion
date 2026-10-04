<script setup>
import {computed, ref} from "vue";
import {UiButton, UiCard, UiBadge, UiProgress, UiSelect, UiSlider, UiAlert} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
const props = defineProps({book: {type: Object, required: true}});
const emit = defineEmits(["bookmark"]);
const settingsOpen = ref(false);
const settings = useState("books-reading-settings", () => ({size: 18, spacing: '1.8', font: 'serif', width: 'comfortable', theme: 'system'}));
const paperStyle = computed(() => ({
  '--reader-font-size': `${settings.value.size}px`,
  '--reader-line-height': settings.value.spacing,
  '--reader-font-family': settings.value.font === 'serif' ? 'Georgia, "Times New Roman", serif' : 'inherit',
  '--reader-text-width': settings.value.width === 'compact' ? '52ch' : '68ch',
}));
function reset() { settings.value = {size: 18, spacing: '1.8', font: 'serif', width: 'comfortable', theme: 'system'}; }
</script>

<template>
  <div class="books-reader">
    <header class="books-reader__toolbar">
      <UiButton variant="ghost" to="/books/library"><SvgIcon name="chevron-right" class="books-reader__back" />Библиотека</UiButton>
      <div class="books-reader__toolbar-actions">
        <UiButton :variant="book.reader.bookmarked ? 'primary' : 'outline'" :aria-pressed="book.reader.bookmarked" @click="emit('bookmark', book.id)"><SvgIcon name="star" />{{ book.reader.bookmarked ? 'В закладках' : 'В закладки' }}</UiButton>
        <UiButton variant="outline" :aria-expanded="settingsOpen" aria-controls="books-reader-settings" @click="settingsOpen = !settingsOpen">Настройки чтения</UiButton>
      </div>
    </header>
    <UiCard v-if="settingsOpen" id="books-reader-settings" raw class="books-reader__settings">
      <div class="books-reader__settings-heading"><h2>Настройте под себя</h2><UiButton variant="ghost" size="sm" @click="reset">Сбросить настройки</UiButton></div>
      <div class="books-reader__settings-grid">
        <div class="books-reader__font-size"><span>Размер текста · {{ settings.size }} px</span><UiSlider v-model="settings.size" :min="14" :max="28" :step="1" label="Размер текста" /></div>
        <UiSelect v-model="settings.font" label="Шрифт" :options="[{label: 'С засечками', value: 'serif'}, {label: 'Без засечек', value: 'sans'}]" />
        <UiSelect v-model="settings.spacing" label="Межстрочный интервал" :options="[{label: 'Компактный', value: '1.5'}, {label: 'Комфортный', value: '1.8'}, {label: 'Свободный', value: '2.1'}]" />
        <UiSelect v-model="settings.width" label="Ширина текста" :options="[{label: 'Комфортная', value: 'comfortable'}, {label: 'Узкая', value: 'compact'}]" />
        <UiSelect v-model="settings.theme" label="Фон страницы" :options="[{label: 'Тема приложения', value: 'system'}, {label: 'Бумага', value: 'paper'}, {label: 'Ночной', value: 'night'}]" />
      </div>
    </UiCard>
    <section class="books-reader__layout" aria-label="Чтение книги">
      <aside class="books-reader__sidebar">
        <UiCard raw class="books-reader__details">
          <div class="books-reader__cover" :class="`space-publication-card--${book.coverTone}`" aria-hidden="true"><SvgIcon name="book" /><strong>{{ book.title }}</strong><span>{{ book.author }}</span></div>
          <div class="books-reader__meta"><UiBadge>{{ book.reader.format }}</UiBadge><span>{{ book.reader.language }}</span></div>
          <UiProgress :value="book.reader.progress" size="sm" :label="`Сохранена страница ${book.reader.page} из ${book.reader.pages}`" show-value />
          <UiButton variant="outline" :to="`/space/${book.spaceId}/publication/${book.id}`">Открыть публикацию<SvgIcon name="arrow-up-right-1" /></UiButton>
        </UiCard>
      </aside>
      <UiCard raw class="books-reader__paper" :class="`books-reader__paper--${settings.theme}`" :style="paperStyle">
        <article class="books-reader__text">
          <header><p class="mebook-kicker">Предпросмотр публикации</p><h1>{{ book.title }}</h1><p class="books-reader__byline">{{ book.author }}</p></header>
          <p class="books-reader__intro">{{ book.subtitle }}</p>
          <p>{{ book.body }}</p>
          <section v-if="book.items?.length" class="books-reader__contents" aria-label="Состав сборника"><h2>В этом сборнике</h2><ol><li v-for="item in book.items" :key="item">{{ item }}</li></ol></section>
          <UiAlert :icon="false" title="Полный текст пока недоступен">Сейчас доступно описание публикации. Чтение по страницам появится после добавления файла книги.</UiAlert>
          <footer><UiButton variant="ghost" to="/books/bookmarks">Мои закладки<SvgIcon name="chevron-right" /></UiButton></footer>
        </article>
      </UiCard>
    </section>
  </div>
</template>
