<script setup>
import {computed, ref} from "vue";
import {useAppStore} from "@/stores/app.js";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiAlert, UiBadge, UiButton, UiCard, UiCheckbox, UiInput, UiProgress, UiRadioGroup, UiSelect, UiSlider, UiTabs, UiTextarea, UiToggle} from "@/components/ui/index.js";

definePageMeta({});
const app = useAppStore();
const activeCategory = ref("buttons");
const inputValue = ref("");
const textareaValue = ref("");
const selectValue = ref("music");
const scrollableSelectValue = ref("service-1");
const checkboxValue = ref(true);
const radioDensity = ref("default");
const radioPlan = ref("pro");
const radioBilling = ref("yearly");
const invalidRadio = ref("");
const toggleBookmark = ref(true);
const toggleBold = ref(false);
const toggleItalic = ref(true);
const sliderValue = ref(33);
const sliderRange = ref([25, 75]);
const sliderMultiple = ref([20, 50, 80]);
const sliderVertical = ref([25, 70]);
const sliderTemperature = ref([0.3, 0.7]);
const progressValue = ref(56);
const densityOptions = [
  {label: "Default", value: "default"},
  {label: "Comfortable", value: "comfortable"},
  {label: "Compact", value: "compact"},
];
const densityDescriptionOptions = densityOptions.map((option) => ({...option, description: option.value === "default" ? "Стандартные отступы для большинства случаев." : option.value === "comfortable" ? "Больше пространства между элементами." : "Минимальные отступы для плотных интерфейсов."}));
const planOptions = [
  {label: "Plus", value: "plus", description: "Для личных проектов и небольших команд."},
  {label: "Pro", value: "pro", description: "Для растущих продуктов и компаний."},
  {label: "Enterprise", value: "enterprise", description: "Для крупных команд и организаций."},
];
const billingOptions = [
  {label: "Ежемесячно — 990 ₽", value: "monthly"},
  {label: "Ежегодно — 9 900 ₽", value: "yearly"},
  {label: "Навсегда — 29 900 ₽", value: "lifetime"},
];
const selectedDisks = ref(["hard-disks"]);
const selectedPeople = ref(["sarah"]);
const people = [
  {id: "sarah", name: "Sarah Chen", email: "sarah.chen@example.com", role: "Admin"},
  {id: "marcus", name: "Marcus Rodriguez", email: "marcus.rodriguez@example.com", role: "User"},
  {id: "priya", name: "Priya Patel", email: "priya.patel@example.com", role: "User"},
];
const allPeopleSelected = computed({
  get: () => selectedPeople.value.length === people.length,
  set: (checked) => { selectedPeople.value = checked ? people.map((person) => person.id) : []; },
});
const somePeopleSelected = computed(() => selectedPeople.value.length > 0 && !allPeopleSelected.value);
const categories = [
  {value: "buttons", label: "Button", count: 13}, {value: "inputs", label: "Input", count: 9},
  {value: "textarea", label: "Textarea", count: 4}, {value: "select", label: "Select", count: 3},
  {value: "checkbox", label: "Checkbox", count: 8}, {value: "radio", label: "Radio Group", count: 6},
  {value: "toggle", label: "Toggle", count: 9},
  {value: "slider", label: "Slider", count: 6},
  {value: "progress", label: "Progress", count: 7},
  {value: "cards", label: "Card", count: 8},
  {value: "alerts", label: "Alert", count: 8}, {value: "badges", label: "Badge", count: 7},
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
          <UiCard>
            <template #header><h3 class="mc-title-3">Icon Button</h3></template>
            <div class="mc-row">
              <UiButton icon aria-label="Уведомления"><SvgIcon name="bell" /></UiButton>
              <UiButton icon rounded aria-label="Настройки"><SvgIcon name="settings" /></UiButton>
              <UiButton icon variant="outline" aria-label="Поиск"><SvgIcon name="search" /></UiButton>
              <UiButton icon variant="ghost" aria-label="Открыть меню"><SvgIcon name="menu" /></UiButton>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Link Button</h3></template>
            <div class="mc-row">
              <UiButton to="/dashboard">Default link</UiButton>
              <UiButton href="#button-links" target="_self" variant="ghost">Ghost link</UiButton>
              <UiButton href="https://mecorion.com" target="_blank" variant="outline">Outline link</UiButton>
            </div>
          </UiCard>
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
        <section v-else-if="activeCategory === 'checkbox'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <div class="ui-checkbox-stack"><UiCheckbox label="Стандартный checkbox" model-value /><UiCheckbox size="sm" label="Маленький checkbox" model-value /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Состояние</h3></template>
            <div class="ui-checkbox-stack"><UiCheckbox v-model="checkboxValue" label="Управляемый checkbox" /><UiCheckbox label="Не выбран" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Описание</h3></template>
            <UiCheckbox label="Получать уведомления" description="Уведомления можно включить или отключить в любое время." />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Invalid</h3></template>
            <UiCheckbox invalid label="Принять условия использования" description="Для продолжения необходимо принять условия." />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <UiCheckbox disabled label="Автоматическое сохранение" description="Эта настройка сейчас недоступна." />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Группа</h3></template>
            <p class="mc-text-sm ui-checkbox-group__description">Выберите устройства, которые нужно показывать на рабочем столе.</p>
            <div class="ui-checkbox-stack">
              <UiCheckbox v-model="selectedDisks" value="hard-disks" label="Жёсткие диски" />
              <UiCheckbox v-model="selectedDisks" value="external-disks" label="Внешние диски" />
              <UiCheckbox v-model="selectedDisks" value="servers" label="Подключённые серверы" />
            </div>
          </UiCard>
          <UiCard class="ui-checkbox-table-card">
            <template #header><h3 class="mc-title-3">Таблица</h3></template>
            <div class="ui-checkbox-table">
              <div class="ui-checkbox-table__row ui-checkbox-table__head">
                <UiCheckbox v-model="allPeopleSelected" :indeterminate="somePeopleSelected" aria-label="Выбрать всех" />
                <strong>Имя</strong><strong>Email</strong><strong>Роль</strong>
              </div>
              <div v-for="person in people" :key="person.id" class="ui-checkbox-table__row">
                <UiCheckbox v-model="selectedPeople" :value="person.id" :aria-label="`Выбрать ${person.name}`" />
                <span>{{ person.name }}</span><span>{{ person.email }}</span><span>{{ person.role }}</span>
              </div>
            </div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'radio'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiRadioGroup v-model="radioDensity" :options="densityOptions" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">С описанием</h3></template>
            <UiRadioGroup v-model="radioDensity" :options="densityDescriptionOptions" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Choice Card</h3></template>
            <UiRadioGroup v-model="radioPlan" variant="cards" :options="planOptions" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Fieldset</h3></template>
            <UiRadioGroup v-model="radioBilling" label="Тарифный период" description="Годовой и бессрочный тарифы позволяют сэкономить." :options="billingOptions" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <UiRadioGroup model-value="default" disabled :options="densityOptions" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Invalid</h3></template>
            <UiRadioGroup v-model="invalidRadio" label="Уведомления" description="Выберите способ получения уведомлений." invalid="Необходимо выбрать один вариант." :options="[{label: 'Только Email', value: 'email'}, {label: 'Только SMS', value: 'sms'}, {label: 'Email и SMS', value: 'both'}]" />
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'toggle'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <div class="mc-row"><UiToggle v-model="toggleBookmark" aria-label="Добавить в избранное"><SvgIcon name="star" /></UiToggle></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Outline</h3></template>
            <div class="mc-row"><UiToggle v-model="toggleBold" variant="outline" aria-label="Полужирный"><strong>B</strong></UiToggle><UiToggle v-model="toggleItalic" variant="outline" aria-label="Курсив"><em>I</em></UiToggle></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">С текстом</h3></template>
            <div class="mc-row"><UiToggle v-model="toggleBookmark"><SvgIcon name="star" /> Избранное</UiToggle></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <div class="mc-row"><UiToggle size="sm">Small</UiToggle><UiToggle>Default</UiToggle><UiToggle size="lg">Large</UiToggle></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <div class="mc-row"><UiToggle disabled>Disabled</UiToggle><UiToggle disabled model-value variant="outline">Disabled active</UiToggle></div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'slider'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiSlider v-model="sliderValue" label="Громкость" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Range</h3></template>
            <UiSlider v-model="sliderRange" label="Диапазон цены" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Multiple Thumbs</h3></template>
            <UiSlider v-model="sliderMultiple" label="Контрольные точки" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Vertical</h3></template>
            <div class="ui-slider-demo-vertical"><UiSlider v-model="sliderVertical" orientation="vertical" label="Вертикальный диапазон" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Controlled</h3></template>
            <div class="ui-slider-demo__heading"><span>Temperature</span><strong>{{ sliderTemperature.join(', ') }}</strong></div>
            <UiSlider v-model="sliderTemperature" :min="0" :max="1" :step="0.1" label="Temperature" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <UiSlider :model-value="[30, 65]" disabled label="Недоступный диапазон" />
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'progress'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiProgress :value="33" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Label and value</h3></template>
            <UiProgress :value="56" label="Загрузка файлов" show-value />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Composition</h3></template>
            <UiProgress :value="72">
              <template #label>Хранилище</template>
              <template #value="{value}">{{ value }} из 100 ГБ</template>
            </UiProgress>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Controlled</h3></template>
            <div class="ui-progress-demo-stack">
              <UiProgress :value="progressValue" label="Выполнение" show-value />
              <UiSlider v-model="progressValue" label="Изменить прогресс" />
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <div class="ui-progress-demo-stack">
              <UiProgress size="sm" :value="42" label="Small" show-value />
              <UiProgress :value="58" label="Default" show-value />
              <UiProgress size="lg" :value="74" label="Large" show-value />
            </div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'cards'" class="uikit-demo-grid uikit-demo-grid--cards">
          <UiCard title="Default" description="Базовая поверхность для структурированного контента."><p class="mc-text">Основное содержимое карточки.</p><template #footer><UiButton size="sm">Действие</UiButton></template></UiCard>
          <UiCard variant="flat" title="Flat" description="Спокойный контейнер без тени."><p class="mc-text-sm">Подходит для вложенных блоков.</p></UiCard>
          <UiCard variant="raised" interactive title="Interactive" description="Интерактивная карточка с hover-состоянием."><p class="mc-text-sm">Карточка реагирует на наведение.</p></UiCard>
          <UiCard title="Композиция" description="Header поддерживает описание и действие.">
            <template #action><UiBadge variant="soft">Новое</UiBadge></template>
            <p class="mc-text">Контент отделён от заголовка и остаётся независимым.</p>
            <template #footer><span class="mc-text-sm">Обновлено недавно</span><UiButton size="sm">Открыть</UiButton></template>
          </UiCard>
          <UiCard title="Стандартный размер" description="Размер по умолчанию использует обычные отступы."><p class="mc-text-sm">Default</p></UiCard>
          <UiCard size="sm" title="Маленький размер" description="Компактные отступы для плотных интерфейсов."><p class="mc-text-sm">size=&quot;sm&quot;</p><template #footer><UiButton size="sm">Настроить</UiButton></template></UiCard>
          <UiCard spacing="32px" title="Настраиваемый spacing" description="Отступы всех частей задаются одним значением."><p class="mc-text-sm">spacing=&quot;32px&quot;</p></UiCard>
          <UiCard title="Карточка с изображением" description="Media располагается перед заголовком.">
            <template #media><div class="ui-card-demo-media">Mecorion</div></template>
            <p class="mc-text">Для обложек событий, сервисов и публикаций.</p>
            <template #footer><UiButton size="sm">Подробнее</UiButton></template>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'alerts'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Иконка</h3></template>
            <UiAlert title="С иконкой">Настройки синхронизированы.</UiAlert>
            <UiAlert :icon="false" title="Без иконки">Настройки синхронизированы.</UiAlert>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Состояния</h3></template>
            <UiAlert title="Информация">Доступно новое обновление системы.</UiAlert>
            <UiAlert variant="success" title="Готово">Изменения успешно сохранены.</UiAlert>
            <UiAlert variant="warning" title="Внимание">Проверьте доступное место.</UiAlert>
            <UiAlert variant="danger" title="Ошибка">Не удалось подключиться к API.</UiAlert>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Действия</h3></template>
            <UiAlert title="Действие справа">Для аккаунта доступно обновление.<template #action><UiButton size="sm">Обновить</UiButton></template></UiAlert>
            <UiAlert action-position="bottom" title="Действие снизу">Сессия скоро завершится.<template #action><UiButton size="sm">Продолжить</UiButton></template></UiAlert>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'badges'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Состояния</h3></template>
            <div class="mc-row"><UiBadge>Default</UiBadge><UiBadge variant="soft">Soft</UiBadge><UiBadge variant="success">Active</UiBadge><UiBadge variant="warning">Pending</UiBadge><UiBadge variant="danger">Blocked</UiBadge></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Интерактивные</h3></template>
            <div class="mc-row"><UiBadge to="/ui-kit">Badge-ссылка</UiBadge><UiBadge loading>Загрузка</UiBadge></div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'icons'" class="uikit-icon-grid"><article v-for="icon in menuIcons" :key="icon" class="uikit-icon-tile"><SvgIcon :name="icon" /><div class="uikit-icon-tile__meta"><strong>{{ icon }}</strong><span>&lt;SvgIcon name="{{ icon }}" /&gt;</span></div></article></section>
        <section v-else class="uikit-demo-grid"><UiCard><p class="mc-caption">Display</p><h3 class="mc-title-display">Mecorion</h3><p class="mc-caption">Title 1</p><h3 class="mc-title-1">Цифровая экосистема</h3><p class="mc-caption">Title 2</p><h3 class="mc-title-2">Каталог компонентов</h3></UiCard><UiCard><p class="mc-text-lg">Крупный текст для вводных блоков.</p><p class="mc-text">Основной интерфейсный текст.</p><p class="mc-text-sm">Вторичный текст и метаданные.</p></UiCard></section>
      </main>
    </div>
  </div></div>
</template>
