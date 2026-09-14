<script setup>
import {computed, ref} from "vue";
import {useAppStore} from "@/stores/app.js";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiAlert, UiBadge, UiButton, UiCard, UiCheckbox, UiInput, UiSelect, UiTabs, UiTextarea} from "@/components/ui/index.js";

definePageMeta({});
const app = useAppStore();
const activeCategory = ref("buttons");
const inputValue = ref("");
const textareaValue = ref("");
const selectValue = ref("music");
const scrollableSelectValue = ref("service-1");
const checkboxValue = ref(true);
const categories = [
  {value: "buttons", label: "Button", count: 6}, {value: "inputs", label: "Input", count: 9},
  {value: "textarea", label: "Textarea", count: 4}, {value: "select", label: "Select", count: 3},
  {value: "checkbox", label: "Checkbox", count: 2}, {value: "cards", label: "Card", count: 3},
  {value: "alerts", label: "Alert", count: 4}, {value: "badges", label: "Badge", count: 5},
  {value: "icons", label: "Icon", count: 21}, {value: "typography", label: "Typography", count: 6},
];
const activeMeta = computed(() => categories.find((item) => item.value === activeCategory.value));
const menuIcons = ["home", "search", "boxes", "grid", "star", "download", "music", "play", "book", "graduation-cap", "cloud", "shield", "users", "badge-check", "git-pull-request", "user", "settings", "menu", "bell", "moon", "sun"];
const manySelectOptions = Array.from({length: 18}, (_, index) => ({label: `Сервис ${index + 1}`, value: `service-${index + 1}`}));
</script>

<template>
  <div class="uikit-view"><div class="mc-shell">
    <header class="uikit-hero">
      <div><p class="mc-caption mc-accent">Mecorion Design System</p><h1 class="mc-title-display">UI Library</h1></div>
      <div class="uikit-hero__aside"><p class="mc-text-lg">Переиспользуемые Vue-компоненты, токены и состояния интерфейса.</p><div class="uikit-hero__controls"><code>@/components/ui</code><div class="uikit-version-switch" role="group" aria-label="Версия интерфейса"><button v-for="version in ['v1', 'v2']" :key="version" class="uikit-version-switch__button" :class="{'uikit-version-switch__button--active': app.uiVersion === version}" type="button" @click="app.setUiVersion(version)">{{ version }}</button></div></div></div>
    </header>

    <div class="uikit-catalog">
      <aside class="uikit-catalog__sidebar"><p class="mc-caption">Компоненты</p><UiTabs v-model="activeCategory" :items="categories" orientation="vertical" /></aside>
      <main class="uikit-catalog__content">
        <header class="uikit-section-heading"><div><p class="mc-caption">Component</p><h2 class="mc-title-1">{{ activeMeta.label }}</h2></div><UiBadge variant="soft">{{ activeMeta.count }} вариантов</UiBadge></header>

        <section v-if="activeCategory === 'buttons'" class="uikit-demo-grid">
          <UiCard><template #header><h3 class="mc-title-3">Варианты</h3></template><div class="mc-row"><UiButton variant="primary">Primary</UiButton><UiButton>Default</UiButton><UiButton variant="ghost">Ghost</UiButton><UiButton variant="danger">Danger</UiButton><UiButton variant="success">Success</UiButton><UiButton variant="warning">Warning</UiButton></div></UiCard>
          <UiCard><template #header><h3 class="mc-title-3">Размеры и состояния</h3></template><div class="mc-row"><UiButton size="lg">Large</UiButton><UiButton>Medium</UiButton><UiButton size="sm">Small</UiButton><UiButton loading>Загрузка</UiButton><UiButton disabled>Disabled</UiButton></div></UiCard>
        </section>
        <section v-else-if="activeCategory === 'inputs'" class="uikit-demo-grid">
          <UiCard><template #header><h3 class="mc-title-3">Состояния</h3></template><UiInput v-model="inputValue" label="Название проекта" placeholder="Mecorion Cloud" hint="До 80 символов" /><UiInput label="Email" type="email" model-value="mail@mecorion.dev" /><UiInput label="С ошибкой" error="Введите корректный адрес" placeholder="name@example.com" /><UiInput label="Успешная проверка" success="Название доступно" model-value="mecorion-cloud" /></UiCard>
          <UiCard><template #header><h3 class="mc-title-3">Размеры</h3></template><UiInput size="lg" label="Большой" placeholder="Large input" /><UiInput size="md" label="Средний" placeholder="Medium input" /><UiInput size="sm" label="Маленький" placeholder="Small input" /></UiCard>
          <UiCard><template #header><h3 class="mc-title-3">Дополнительный контент</h3></template><UiInput label="Поиск" placeholder="Найти компонент"><template #prefix><SvgIcon name="search" /></template></UiInput><UiInput label="Адрес пространства" model-value="design-system"><template #suffix>.mecorion</template></UiInput></UiCard>
        </section>
        <section v-else-if="activeCategory === 'textarea'" class="uikit-demo-grid">
          <UiCard><template #header><h3 class="mc-title-3">Состояния</h3></template><UiTextarea v-model="textareaValue" label="Описание" placeholder="Расскажите о пространстве" hint="Поддерживает многострочный текст" /><UiTextarea label="Успешная проверка" success="Описание заполнено корректно" model-value="Готовое описание пространства." /><UiTextarea label="Ошибка" danger="Описание должно содержать не менее 20 символов" model-value="Коротко" /></UiCard>
          <UiCard><UiTextarea label="Только чтение" model-value="Компонент принимает стандартные HTML-атрибуты." readonly /></UiCard>
        </section>
        <section v-else-if="activeCategory === 'select'" class="uikit-demo-grid"><UiCard><template #header><h3 class="mc-title-3">Основной</h3></template><UiSelect v-model="selectValue" label="Сервис" :options="[{label: 'Music', value: 'music'}, {label: 'Video', value: 'video'}, {label: 'Books', value: 'books'}]" /></UiCard><UiCard><template #header><h3 class="mc-title-3">Scrollable</h3></template><UiSelect v-model="scrollableSelectValue" label="Большой список" :options="manySelectOptions" scrollable /></UiCard><UiCard><template #header><h3 class="mc-title-3">Invalid</h3></template><UiSelect label="Обязательное поле" placeholder="Выберите сервис" invalid="Выберите один из доступных сервисов" :options="[{label: 'Music', value: 'music'}, {label: 'Video', value: 'video'}]" /></UiCard></section>
        <section v-else-if="activeCategory === 'checkbox'" class="uikit-demo-grid"><UiCard><UiCheckbox v-model="checkboxValue" label="Получать уведомления" description="Сообщим о важных событиях аккаунта" /><UiCheckbox label="Автоматическое сохранение" /></UiCard></section>
        <section v-else-if="activeCategory === 'cards'" class="uikit-demo-grid uikit-demo-grid--cards">
          <UiCard><template #header><h3 class="mc-title-3">Default</h3></template><p class="mc-text">Базовая поверхность для контента.</p><template #footer><UiButton size="sm">Действие</UiButton></template></UiCard>
          <UiCard variant="flat"><h3 class="mc-title-3">Flat</h3><p class="mc-text-sm">Спокойный контейнер второго уровня.</p></UiCard>
          <UiCard variant="raised" interactive><h3 class="mc-title-3">Interactive</h3><p class="mc-text-sm">Карточка с интерактивным состоянием.</p></UiCard>
        </section>
        <section v-else-if="activeCategory === 'alerts'" class="uikit-demo-grid"><UiAlert title="Информация">Настройки синхронизированы.</UiAlert><UiAlert variant="success" title="Готово">Изменения успешно сохранены.</UiAlert><UiAlert variant="warning" title="Внимание">Проверьте доступное место.</UiAlert><UiAlert variant="danger" title="Ошибка">Не удалось подключиться к API.</UiAlert></section>
        <section v-else-if="activeCategory === 'badges'" class="uikit-demo-grid"><UiCard><div class="mc-row"><UiBadge>Default</UiBadge><UiBadge variant="soft">Soft</UiBadge><UiBadge variant="success">Active</UiBadge><UiBadge variant="warning">Pending</UiBadge><UiBadge variant="danger">Blocked</UiBadge></div></UiCard></section>
        <section v-else-if="activeCategory === 'icons'" class="uikit-icon-grid"><article v-for="icon in menuIcons" :key="icon" class="uikit-icon-tile"><SvgIcon :name="icon" /><div class="uikit-icon-tile__meta"><strong>{{ icon }}</strong><span>&lt;SvgIcon name="{{ icon }}" /&gt;</span></div></article></section>
        <section v-else class="uikit-demo-grid"><UiCard><p class="mc-caption">Display</p><h3 class="mc-title-display">Mecorion</h3><p class="mc-caption">Title 1</p><h3 class="mc-title-1">Цифровая экосистема</h3><p class="mc-caption">Title 2</p><h3 class="mc-title-2">Каталог компонентов</h3></UiCard><UiCard><p class="mc-text-lg">Крупный текст для вводных блоков.</p><p class="mc-text">Основной интерфейсный текст.</p><p class="mc-text-sm">Вторичный текст и метаданные.</p></UiCard></section>
      </main>
    </div>
  </div></div>
</template>
