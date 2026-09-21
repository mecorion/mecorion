<script setup>
import {computed, ref} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import SectionHeader from "@/components/layout/SectionHeader.vue";
import ComponentDocumentation from "@/components/ui-kit/ComponentDocumentation.vue";
import {componentDocumentation} from "@/ui-kit/componentDocumentation.js";
import {UiAlert, UiAvatar, UiAvatarGroup, UiAvatarGroupCount, UiBadge, UiBreadcrumb, UiButton, UiCard, UiCheckbox, UiDialog, UiDrawer, UiDropdownMenu, UiEmptyState, UiField, UiFieldGroup, UiFieldSeparator, UiFieldset, UiFilePicker, UiForm, UiInput, UiItem, UiItemGroup, UiItemSeparator, UiPopover, UiProgress, UiRadioGroup, UiSelect, UiSkeleton, UiSlider, UiSpinner, UiTabs, UiTextarea, UiToggle, UiTooltip} from "@/components/ui/index.js";

definePageMeta({});
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
const fieldPrice = ref([200, 800]);
const fieldDepartment = ref("");
const singleFile = ref(null);
const multipleFiles = ref([]);
const imageFiles = ref([]);
const documentFile = ref(null);
const compactFiles = ref([]);
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
  {value: "avatar", label: "Avatar", count: 9},
  {value: "breadcrumb", label: "Breadcrumb", count: 6},
  {value: "empty", label: "Empty State", count: 7},
  {value: "skeleton", label: "Skeleton", count: 6},
  {value: "item", label: "Item", count: 14},
  {value: "drawer", label: "Drawer", count: 10},
  {value: "dialog", label: "Dialog", count: 6},
  {value: "popover", label: "Popover", count: 10},
  {value: "dropdown-menu", label: "Dropdown Menu", count: 9},
  {value: "tooltip", label: "Tooltip", count: 8},
  {value: "field", label: "Field", count: 10},
  {value: "form", label: "Form", count: 5},
  {value: "file-picker", label: "File Picker", count: 7},
  {value: "textarea", label: "Textarea", count: 4}, {value: "select", label: "Select", count: 4},
  {value: "checkbox", label: "Checkbox", count: 8}, {value: "radio", label: "Radio Group", count: 6},
  {value: "toggle", label: "Toggle", count: 9},
  {value: "slider", label: "Slider", count: 6},
  {value: "progress", label: "Progress", count: 7},
  {value: "spinner", label: "Spinner", count: 13},
  {value: "cards", label: "Card", count: 8},
  {value: "alerts", label: "Alert", count: 8}, {value: "badges", label: "Badge", count: 7},
  {value: "icons", label: "Icon", count: 21}, {value: "typography", label: "Typography", count: 6},
];
const activeMeta = computed(() => categories.find((item) => item.value === activeCategory.value));
const activeDocumentation = computed(() => componentDocumentation[activeCategory.value]);
const menuIcons = ["home", "search", "boxes", "grid", "star", "download", "music", "play", "book", "graduation-cap", "cloud", "shield", "users", "badge-check", "git-pull-request", "user", "settings", "menu", "bell", "moon", "sun"];
const manySelectOptions = Array.from({length: 18}, (_, index) => ({label: `Сервис ${index + 1}`, value: `service-${index + 1}`}));
const dropdownBasic = [{type: "label", label: "Мой аккаунт"}, {id: "profile", label: "Профиль"}, {id: "billing", label: "Подписка"}, {type: "separator"}, {id: "team", label: "Команда"}, {id: "logout", label: "Выйти"}];
const dropdownSubmenu = [{id: "new", label: "Создать", items: undefined}, {type: "submenu", label: "Пригласить пользователей", items: [{id: "email", label: "По Email"}, {id: "link", label: "По ссылке"}, {type: "submenu", label: "Другие способы", items: [{id: "qr", label: "QR-код"}, {id: "contacts", label: "Из контактов"}]}]}, {type: "separator"}, {id: "settings", label: "Настройки"}];
const dropdownShortcuts = [{id: "new-tab", label: "Новая вкладка", shortcut: "⌘T"}, {id: "new-window", label: "Новое окно", shortcut: "⌘N"}, {type: "separator"}, {id: "search", label: "Поиск", shortcut: "⌘K"}];
const dropdownIcons = [{id: "profile-icon", label: "Профиль", icon: "user"}, {id: "team-icon", label: "Команда", icon: "users"}, {id: "settings-icon", label: "Настройки", icon: "settings"}];
const dropdownCheckboxes = [{type: "label", label: "Отображение"}, {id: "status-bar", type: "checkbox", label: "Строка состояния", checked: true}, {id: "activity-bar", type: "checkbox", label: "Панель активности", checked: false}, {id: "panel", type: "checkbox", label: "Нижняя панель", checked: true}];
const dropdownRadio = [{type: "label", label: "Положение панели"}, {id: "radio-top", type: "radio", group: "panel", label: "Сверху", checked: false}, {id: "radio-bottom", type: "radio", group: "panel", label: "Снизу", checked: true}, {id: "radio-right", type: "radio", group: "panel", label: "Справа", checked: false}];
const dropdownDestructive = [{id: "edit", label: "Редактировать", icon: "settings"}, {id: "share", label: "Поделиться", icon: "users"}, {type: "separator"}, {id: "delete", label: "Удалить", icon: "exit", variant: "danger"}];
const dropdownComplex = [{type: "label", label: "Проект Mecorion"}, {id: "open", label: "Открыть", icon: "grid", shortcut: "↵"}, {id: "favorite", type: "checkbox", label: "В избранном", icon: "star", checked: true}, {type: "submenu", label: "Переместить в сервис", icon: "boxes", items: [{id: "music-service", label: "Music", icon: "music"}, {id: "book-service", label: "Books", icon: "book"}, {id: "cloud-service", label: "Cloud", icon: "cloud"}]}, {type: "separator"}, {id: "complex-delete", label: "Удалить проект", icon: "exit", variant: "danger"}];
</script>

<template>
  <div class="uikit-view"><div class="mc-shell">
    <header class="uikit-hero">
      <div><p class="mc-caption mc-accent">Mecorion Design System</p><h1 class="mc-title-display">UI Library</h1></div>
      <div class="uikit-hero__aside"><p class="mc-text-lg">Переиспользуемые Vue-компоненты, токены и состояния интерфейса.</p><div class="uikit-hero__controls"><code>@/components/ui</code></div></div>
    </header>

    <div class="uikit-catalog">
      <aside class="uikit-catalog__sidebar"><p class="mc-caption">Компоненты</p><UiTabs v-model="activeCategory" :items="categories" orientation="vertical" /></aside>
      <main class="uikit-catalog__content">
        <SectionHeader class="uikit-section-heading" eyebrow="Component" :title="activeMeta.label" eyebrow-class="mc-caption" title-class="mc-title-1"><template #action><UiBadge variant="soft">{{ activeMeta.count }} вариантов</UiBadge></template></SectionHeader>

        <ComponentDocumentation v-bind="activeDocumentation" />

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
        <section v-else-if="activeCategory === 'avatar'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <div class="mc-row"><UiAvatar src="https://github.com/shadcn.png" alt="Профиль shadcn" fallback="CN" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Fallback</h3></template>
            <div class="mc-row"><UiAvatar fallback="ИИ" /><UiAvatar src="/missing-avatar.png" alt="Иван Иванов" fallback="ИИ" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Badge</h3></template>
            <div class="mc-row"><UiAvatar fallback="ИИ" status="online" /><UiAvatar fallback="АК" status="busy" /><UiAvatar fallback="МП" status="offline" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Badge with icon</h3></template>
            <div class="mc-row"><UiAvatar fallback="PP"><template #badge>+</template></UiAvatar></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar Group</h3></template>
            <UiAvatarGroup><UiAvatar fallback="CN" /><UiAvatar fallback="LR" /><UiAvatar fallback="ER" /></UiAvatarGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Group Count</h3></template>
            <UiAvatarGroup><UiAvatar fallback="CN" /><UiAvatar fallback="LR" /><UiAvatar fallback="ER" /><UiAvatarGroupCount :count="3" /></UiAvatarGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Group Count with icon</h3></template>
            <UiAvatarGroup><UiAvatar fallback="CN" /><UiAvatar fallback="LR" /><UiAvatar fallback="ER" /><UiAvatarGroupCount label="Добавить пользователя">+</UiAvatarGroupCount></UiAvatarGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <div class="mc-row"><UiAvatar size="sm" fallback="CN" /><UiAvatar fallback="CN" /><UiAvatar size="lg" fallback="CN" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Dropdown trigger</h3></template>
            <div class="mc-row"><UiAvatar interactive src="https://github.com/shadcn.png" alt="Открыть меню профиля" fallback="CN" /></div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'breadcrumb'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiBreadcrumb :items="[{label: 'Главная', to: '/'}, {label: 'Компоненты', href: '#components'}, {label: 'Breadcrumb'}]" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Custom separator</h3></template>
            <UiBreadcrumb :items="[{label: 'Главная', to: '/'}, {label: 'Компоненты', href: '#components'}, {label: 'Breadcrumb'}]"><template #separator>•</template></UiBreadcrumb>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Dropdown</h3></template>
            <UiBreadcrumb :items="[{label: 'Главная', to: '/'}, {label: 'Компоненты', children: [{label: 'Button', href: '#buttons'}, {label: 'Select', href: '#select'}, {label: 'Tooltip', href: '#tooltip'}]}, {label: 'Breadcrumb'}]" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Collapsed</h3></template>
            <UiBreadcrumb :max-items="4" :items="[{label: 'Главная', to: '/'}, {label: 'Документация', href: '#docs'}, {label: 'UI Kit', href: '#ui-kit'}, {label: 'Компоненты', href: '#components'}, {label: 'Навигация', href: '#navigation'}, {label: 'Breadcrumb'}]" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Router links</h3></template>
            <UiBreadcrumb :items="[{label: 'Dashboard', to: '/dashboard'}, {label: 'Настройки', to: '/settings'}, {label: 'Интерфейс'}]" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Long labels</h3></template>
            <UiBreadcrumb :items="[{label: 'Рабочее пространство', to: '/spaces'}, {label: 'Библиотека переиспользуемых компонентов интерфейса', href: '#library'}, {label: 'Текущий компонент'}]" />
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'empty'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiEmptyState media-variant="icon" title="Проектов пока нет" description="Создайте первый проект или импортируйте уже существующий.">
              <template #media><SvgIcon name="boxes" /></template>
              <template #actions><UiButton>Создать проект</UiButton><UiButton variant="outline">Импортировать</UiButton></template>
              <template #footer><UiButton variant="ghost" href="#empty-learn-more">Подробнее</UiButton></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Outline</h3></template>
            <UiEmptyState variant="outline" media-variant="icon" title="Облачное хранилище пусто" description="Загрузите файлы, чтобы получить к ним доступ с любого устройства.">
              <template #media><SvgIcon name="cloud" /></template>
              <template #actions><UiButton>Загрузить файлы</UiButton></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Background</h3></template>
            <UiEmptyState variant="background" media-variant="icon" title="Новых уведомлений нет" description="Здесь появятся новые события и обновления.">
              <template #media><SvgIcon name="bell" /></template>
              <template #actions><UiButton>Обновить</UiButton></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar</h3></template>
            <UiEmptyState title="Пользователь не в сети" description="Оставьте сообщение — пользователь получит уведомление, когда вернётся.">
              <template #media><UiAvatar size="lg" fallback="LR" status="offline" /></template>
              <template #actions><UiButton>Оставить сообщение</UiButton></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar Group</h3></template>
            <UiEmptyState title="В команде пока никого нет" description="Пригласите участников для совместной работы над проектом.">
              <template #media><UiAvatarGroup><UiAvatar fallback="CN" /><UiAvatar fallback="LR" /><UiAvatar fallback="ER" /></UiAvatarGroup></template>
              <template #actions><UiButton>Пригласить участников</UiButton></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Input</h3></template>
            <UiEmptyState title="404 — страница не найдена" description="Попробуйте найти нужную страницу через поиск.">
              <template #media><SvgIcon name="search" /></template>
              <UiInput placeholder="Поиск по страницам"><template #prefix><SvgIcon name="search" /></template><template #suffix><UiButton size="sm">Найти</UiButton></template></UiInput>
              <template #footer><span class="mc-text-sm">Нужна помощь? <a href="#support">Связаться с поддержкой</a></span></template>
            </UiEmptyState>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Compact</h3></template>
            <UiEmptyState size="sm" media-variant="icon" title="Нет результатов" description="Измените параметры поиска или сбросьте фильтры.">
              <template #media><SvgIcon name="search" /></template>
              <template #actions><UiButton size="sm" variant="outline">Сбросить фильтры</UiButton></template>
            </UiEmptyState>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'skeleton'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <div class="ui-skeleton-stack"><UiSkeleton width="100px" height="20px" radius="999px" /><UiSkeleton width="70%" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar</h3></template>
            <div class="ui-skeleton-avatar"><UiSkeleton shape="circle" width="48px" height="48px" /><div class="ui-skeleton-stack"><UiSkeleton width="160px" height="16px" /><UiSkeleton width="110px" height="12px" /></div></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Card</h3></template>
            <div class="ui-skeleton-card"><UiSkeleton height="180px" /><div class="ui-skeleton-stack"><UiSkeleton width="55%" height="22px" /><UiSkeleton /><UiSkeleton width="82%" /></div></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Text</h3></template>
            <div class="ui-skeleton-stack"><UiSkeleton v-for="width in ['100%', '94%', '87%', '62%']" :key="width" :width="width" height="14px" shape="text" /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Form</h3></template>
            <div class="ui-skeleton-form">
              <div class="ui-skeleton-stack"><UiSkeleton width="90px" height="12px" /><UiSkeleton height="48px" /></div>
              <div class="ui-skeleton-stack"><UiSkeleton width="120px" height="12px" /><UiSkeleton height="48px" /></div>
              <UiSkeleton width="140px" height="44px" />
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Table</h3></template>
            <div class="ui-skeleton-table" role="status" aria-label="Таблица загружается">
              <div v-for="row in 5" :key="row" class="ui-skeleton-table__row">
                <UiSkeleton shape="circle" width="32px" height="32px" />
                <UiSkeleton :width="row === 1 ? '85%' : '70%'" />
                <UiSkeleton :width="row === 1 ? '75%' : '58%'" />
                <UiSkeleton width="60px" />
              </div>
            </div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'item'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiItem title="Базовый элемент" description="Заголовок, описание и действие в одной строке."><template #actions><UiButton size="sm">Действие</UiButton></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Варианты</h3></template>
            <UiItemGroup><UiItem title="Default" description="Прозрачный фон без рамки." /><UiItem variant="outline" title="Outline" description="Выделенная рамка элемента." /><UiItem variant="muted" title="Muted" description="Спокойный фон для вторичного контента." /></UiItemGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <UiItemGroup><UiItem title="Default" description="Стандартная плотность." /><UiItem size="sm" title="Small" description="Компактная строка." /><UiItem size="xs" title="Extra Small" description="Максимально плотная строка." /></UiItemGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Icon</h3></template>
            <UiItem variant="outline" media-variant="icon" title="Предупреждение безопасности" description="Обнаружен вход с неизвестного устройства."><template #media><SvgIcon name="shield" /></template><template #actions><UiButton size="sm" variant="outline">Проверить</UiButton></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar</h3></template>
            <UiItem title="Evil Rabbit" description="Был в сети пять месяцев назад."><template #media><UiAvatar fallback="ER" status="offline" /></template><template #actions><UiBadge>Участник</UiBadge></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Image</h3></template>
            <UiItem media-variant="image" title="Midnight City Lights" description="Electric Nights · Neon Dreams · 3:45"><template #media><div class="ui-item-demo-image">M</div></template><template #actions><UiButton icon variant="ghost" aria-label="Воспроизвести"><SvgIcon name="play" /></UiButton></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Group</h3></template>
            <UiItemGroup><UiItem size="sm" title="shadcn" description="shadcn@vercel.com"><template #media><UiAvatar size="sm" fallback="S" /></template></UiItem><UiItemSeparator /><UiItem size="sm" title="maxleiter" description="maxleiter@vercel.com"><template #media><UiAvatar size="sm" fallback="M" /></template></UiItem><UiItemSeparator /><UiItem size="sm" title="evilrabbit" description="evilrabbit@vercel.com"><template #media><UiAvatar size="sm" fallback="E" /></template></UiItem></UiItemGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Header and Footer</h3></template>
            <UiItem variant="outline" title="v0-2.0-mini" description="Open Source model for everyone."><template #header><UiBadge variant="soft">Новая модель</UiBadge></template><template #media><div class="ui-item-demo-image">v0</div></template><template #footer><span class="mc-text-sm">Обновлено сегодня</span><UiButton size="sm">Открыть</UiButton></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Link</h3></template>
            <UiItem to="/dashboard" variant="outline" media-variant="icon" title="Перейти в Dashboard" description="Обзор аккаунта и текущей активности."><template #media><SvgIcon name="home" /></template><template #actions><span aria-hidden="true">→</span></template></UiItem>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Actions</h3></template>
            <UiItem variant="muted" title="Настройки публикации" description="Измените видимость или удалите публикацию."><template #actions><UiButton size="sm" variant="ghost">Изменить</UiButton><UiButton size="sm" variant="danger">Удалить</UiButton></template></UiItem>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'drawer'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiDrawer title="Новый проект" description="Создайте проект и пригласите участников.">
              <template #trigger="{open}"><UiButton @click="open">Открыть Drawer</UiButton></template>
              <UiInput label="Название проекта" placeholder="Mecorion Cloud" />
              <template #footer="{close}"><UiButton variant="outline" @click="close">Отмена</UiButton><UiButton @click="close">Создать</UiButton></template>
            </UiDrawer>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Sides</h3></template>
            <div class="mc-row">
              <UiDrawer v-for="side in ['top', 'right', 'bottom', 'left']" :key="side" :side="side" :title="`Drawer: ${side}`" description="Панель может появляться с любой стороны экрана.">
                <template #trigger="{open}"><UiButton variant="outline" @click="open">{{ side }}</UiButton></template>
                <p class="mc-text-secondary">Контент боковой панели.</p>
              </UiDrawer>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Custom size</h3></template>
            <UiDrawer side="right" size="min(520px, 92vw)" title="Широкая панель" description="Размер задаётся через prop size.">
              <template #trigger="{open}"><UiButton @click="open">Открыть широкую</UiButton></template>
              <p class="mc-text-secondary">Подходит для форм и подробной информации.</p>
            </UiDrawer>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Without handle</h3></template>
            <UiDrawer :show-handle="false" title="Без индикатора" description="Вертикальная панель без верхней ручки.">
              <template #trigger="{open}"><UiButton variant="outline" @click="open">Без ручки</UiButton></template>
              <p class="mc-text-secondary">Ручка отключается независимо от заголовка.</p>
            </UiDrawer>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Non-modal</h3></template>
            <UiDrawer side="right" :modal="false" title="Немодальная панель" description="Остальная страница остаётся доступной.">
              <template #trigger="{open}"><UiButton variant="outline" @click="open">Non-modal</UiButton></template>
              <p class="mc-text-secondary">Нет overlay и блокировки прокрутки страницы.</p>
            </UiDrawer>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Non-dismissible</h3></template>
            <UiDrawer :dismissible="false" title="Подтвердите действие" description="Escape и клик по overlay не закроют панель.">
              <template #trigger="{open}"><UiButton variant="danger" @click="open">Важное действие</UiButton></template>
              <p class="mc-text-secondary">Закрытие доступно через явную кнопку.</p>
              <template #footer="{close}"><UiButton variant="default" @click="close">Закрыть</UiButton></template>
            </UiDrawer>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Nested</h3></template>
            <UiDrawer title="Родительская панель" description="Drawer может содержать другой Drawer.">
              <template #trigger="{open}"><UiButton @click="open">Открыть вложенный</UiButton></template>
              <UiDrawer side="right" title="Вложенная панель" description="Открыта поверх родительской.">
                <template #trigger="{open}"><UiButton variant="outline" @click="open">Следующий Drawer</UiButton></template>
                <p class="mc-text-secondary">Вложенный контент.</p>
              </UiDrawer>
            </UiDrawer>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'dialog'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiDialog title="Редактировать профиль" description="Изменения будут применены ко всем сервисам Mecorion.">
              <template #trigger="{open}"><UiButton @click="open">Открыть Dialog</UiButton></template>
              <UiFieldGroup><UiInput label="Имя" model-value="Иван" /><UiInput label="Username" model-value="ivan" /></UiFieldGroup>
              <template #footer="{close}"><UiButton variant="outline" @click="close">Отмена</UiButton><UiButton @click="close">Сохранить</UiButton></template>
            </UiDialog>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Sizes</h3></template>
            <div class="mc-row">
              <UiDialog v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size" :title="`Dialog ${size}`" description="Размер окна выбирается через prop size.">
                <template #trigger="{open}"><UiButton variant="outline" @click="open">{{ size }}</UiButton></template>
                <p class="mc-text-secondary">Содержимое модального окна.</p>
              </UiDialog>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Custom close</h3></template>
            <UiDialog title="Поделиться проектом" description="Скопируйте ссылку и отправьте её участникам.">
              <template #trigger="{open}"><UiButton variant="outline" @click="open">Custom close</UiButton></template>
              <template #close="{close}"><UiButton size="sm" variant="ghost" @click="close">Готово</UiButton></template>
              <UiInput label="Ссылка" model-value="https://mecorion.dev/project" readonly />
            </UiDialog>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">No close button</h3></template>
            <UiDialog :show-close="false" title="Без кнопки закрытия" description="Окно закрывается по Escape, overlay или действию в footer.">
              <template #trigger="{open}"><UiButton variant="outline" @click="open">Без крестика</UiButton></template>
              <p class="mc-text-secondary">Полезно, когда закрытие должно быть частью сценария.</p>
              <template #footer="{close}"><UiButton variant="default" @click="close">Закрыть</UiButton></template>
            </UiDialog>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Sticky footer</h3></template>
            <UiDialog sticky-footer size="lg" title="Условия использования" description="Footer остаётся видимым при прокрутке.">
              <template #trigger="{open}"><UiButton variant="outline" @click="open">Sticky footer</UiButton></template>
              <div class="ui-dialog-demo-copy"><p v-for="index in 10" :key="index">Раздел {{ index }}. Данные аккаунта используются только для работы сервисов Mecorion и синхронизации пользовательских настроек.</p></div>
              <template #footer="{close}"><UiButton variant="outline" @click="close">Отмена</UiButton><UiButton @click="close">Принять</UiButton></template>
            </UiDialog>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Scrollable content</h3></template>
            <UiDialog size="md" title="История изменений" description="Заголовок остаётся на месте, содержимое прокручивается.">
              <template #trigger="{open}"><UiButton @click="open">Scrollable</UiButton></template>
              <UiItemGroup><UiItem v-for="index in 12" :key="index" size="sm" :title="`Версия 1.${13 - index}`" :description="`Изменения интерфейса и компонентов — запись ${index}.`" /><UiItemSeparator /></UiItemGroup>
            </UiDialog>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'popover'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiPopover title="Настройки пространства" description="Управляйте отображением и доступом.">
              <template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Открыть Popover</UiButton></template>
              <p class="mc-text-secondary">Здесь может находиться любой интерактивный контент.</p>
            </UiPopover>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Align</h3></template>
            <div class="mc-row">
              <UiPopover v-for="align in ['start', 'center', 'end']" :key="align" :align="align" :title="`Align: ${align}`" width="240px">
                <template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">{{ align }}</UiButton></template>
                <span class="mc-text-sm">Положение относительно trigger.</span>
              </UiPopover>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Side</h3></template>
            <div class="mc-row">
              <UiPopover v-for="side in ['top', 'right', 'bottom', 'left']" :key="side" :side="side" :title="`Side: ${side}`" width="220px">
                <template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">{{ side }}</UiButton></template>
                <span class="mc-text-sm">При нехватке места сторона изменится автоматически.</span>
              </UiPopover>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">With form</h3></template>
            <UiPopover align="start" title="Размеры" description="Настройте ширину и высоту блока." width="360px">
              <template #trigger="{toggle}"><UiButton @click="toggle">Изменить размеры</UiButton></template>
              <template #default="{close}">
                <UiForm spacing="compact">
                  <UiFieldGroup><UiInput label="Ширина" model-value="100%" size="sm" /><UiInput label="Высота" model-value="320px" size="sm" /></UiFieldGroup>
                  <template #actions><UiButton size="sm" @click="close">Применить</UiButton></template>
                </UiForm>
              </template>
            </UiPopover>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Trigger width</h3></template>
            <UiPopover match-trigger-width align="start" title="Быстрые действия">
              <template #trigger="{toggle}"><UiButton class="ui-popover-demo-wide-trigger" variant="outline" @click="toggle">Ширина как у trigger</UiButton></template>
              <UiItemGroup><UiItem size="sm" title="Создать проект" /><UiItemSeparator /><UiItem size="sm" title="Импортировать данные" /></UiItemGroup>
            </UiPopover>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'dropdown-menu'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiDropdownMenu :items="dropdownBasic"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Открыть меню</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Submenu</h3></template>
            <UiDropdownMenu :items="dropdownSubmenu" align="start"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Вложенное меню</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Shortcuts</h3></template>
            <UiDropdownMenu :items="dropdownShortcuts"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Команды</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Icons</h3></template>
            <UiDropdownMenu :items="dropdownIcons"><template #trigger="{toggle}"><UiButton @click="toggle">Аккаунт</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Checkboxes</h3></template>
            <UiDropdownMenu :items="dropdownCheckboxes"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Отображение</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Radio group</h3></template>
            <UiDropdownMenu :items="dropdownRadio"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Положение панели</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Destructive</h3></template>
            <UiDropdownMenu :items="dropdownDestructive"><template #trigger="{toggle}"><UiButton variant="outline" @click="toggle">Действия</UiButton></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Avatar trigger</h3></template>
            <UiDropdownMenu :items="dropdownBasic" align="start"><template #trigger="{toggle}"><button class="ui-dropdown-menu-demo-avatar" type="button" aria-label="Открыть меню пользователя" @click="toggle"><UiAvatar fallback="ИИ" status="online" /></button></template></UiDropdownMenu>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Complex</h3></template>
            <UiDropdownMenu :items="dropdownComplex" width="260px"><template #trigger="{toggle}"><UiButton @click="toggle">Сложное меню</UiButton></template></UiDropdownMenu>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'tooltip'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <div class="mc-row"><UiTooltip content="Добавить в библиотеку"><UiButton>Наведи на меня</UiButton></UiTooltip></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Side</h3></template>
            <div class="mc-row">
              <UiTooltip side="left" content="Слева"><UiButton variant="outline">Left</UiButton></UiTooltip>
              <UiTooltip side="top" content="Сверху"><UiButton variant="outline">Top</UiButton></UiTooltip>
              <UiTooltip side="bottom" content="Снизу"><UiButton variant="outline">Bottom</UiButton></UiTooltip>
              <UiTooltip side="right" content="Справа"><UiButton variant="outline">Right</UiButton></UiTooltip>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Keyboard shortcut</h3></template>
            <div class="mc-row">
              <UiTooltip content="Сохранить изменения"><template #shortcut>⌘S</template><UiButton>Сохранить</UiButton></UiTooltip>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled Button</h3></template>
            <div class="mc-row"><UiTooltip content="Действие сейчас недоступно" tabindex="0"><UiButton disabled>Disabled</UiButton></UiTooltip></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Custom content</h3></template>
            <div class="mc-row">
              <UiTooltip :delay="0">
                <UiButton icon variant="ghost" aria-label="Информация">?</UiButton>
                <template #content><strong>Без задержки</strong> — подходит для компактных подсказок.</template>
              </UiTooltip>
            </div>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'inputs'" class="uikit-demo-grid">
          <UiCard><template #header><h3 class="mc-title-3">Состояния</h3></template><UiInput v-model="inputValue" label="Название проекта" placeholder="Mecorion Cloud" hint="До 80 символов" /><UiInput label="Email" type="email" model-value="mail@mecorion.dev" /><UiInput label="С ошибкой" error="Введите корректный адрес" placeholder="name@example.com" /><UiInput label="Успешная проверка" success="Название доступно" model-value="mecorion-cloud" /></UiCard>
          <UiCard><template #header><h3 class="mc-title-3">Размеры</h3></template><UiInput size="lg" label="Большой" placeholder="Large input" /><UiInput size="md" label="Средний" placeholder="Medium input" /><UiInput size="sm" label="Маленький" placeholder="Small input" /></UiCard>
          <UiCard><template #header><h3 class="mc-title-3">Дополнительный контент</h3></template><UiInput label="Поиск" placeholder="Найти компонент"><template #prefix><SvgIcon name="search" /></template></UiInput><UiInput label="Адрес пространства" model-value="design-system"><template #suffix>.mecorion</template></UiInput></UiCard>
        </section>
        <section v-else-if="activeCategory === 'field'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Input</h3></template>
            <UiField id="field-username" label="Имя пользователя" description="Выберите уникальное имя для аккаунта.">
              <UiInput id="field-username" model-value="mecorion" autocomplete="off" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Textarea</h3></template>
            <UiField id="field-feedback" label="Обратная связь" description="Расскажите, что можно улучшить.">
              <UiTextarea id="field-feedback" placeholder="Ваши мысли о сервисе" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Select</h3></template>
            <UiField id="field-department" label="Отдел" description="Выберите направление вашей работы.">
              <UiSelect id="field-department" v-model="fieldDepartment" placeholder="Выберите отдел" :options="[{label: 'Дизайн', value: 'design'}, {label: 'Разработка', value: 'development'}, {label: 'Маркетинг', value: 'marketing'}]" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Slider</h3></template>
            <UiField label="Диапазон цены" :description="`Укажите бюджет (${fieldPrice[0]}–${fieldPrice[1]} ₽).`">
              <UiSlider v-model="fieldPrice" :min="0" :max="1000" :step="50" label="Диапазон цены" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Validation</h3></template>
            <UiField id="field-email" label="Email" error="Введите корректный адрес электронной почты.">
              <template #default="{id, invalid}"><UiInput :id="id" model-value="wrong-address" :error="invalid ? ' ' : ''" aria-invalid="true" /></template>
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Horizontal</h3></template>
            <UiField id="field-notifications" orientation="horizontal" label="Уведомления" description="Получать новости и обновления продукта.">
              <UiCheckbox id="field-notifications" model-value aria-label="Уведомления" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Responsive</h3></template>
            <UiField id="field-name" orientation="responsive" label="Полное имя" description="Используется в профиле и документах.">
              <UiInput id="field-name" model-value="Иван Иванов" />
            </UiField>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Fieldset</h3></template>
            <UiFieldset legend="Адрес доставки" description="Укажите адрес, по которому нужно доставить заказ.">
              <UiFieldGroup>
                <UiField id="field-street" label="Улица"><UiInput id="field-street" placeholder="Название улицы" /></UiField>
                <UiField id="field-city" label="Город"><UiInput id="field-city" placeholder="Название города" /></UiField>
              </UiFieldGroup>
            </UiFieldset>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Field Group</h3></template>
            <UiFieldGroup>
              <UiField label="Ответы" description="Сообщать о завершении долгих запросов."><UiCheckbox label="Push-уведомления" /></UiField>
              <UiFieldSeparator>или</UiFieldSeparator>
              <UiField label="Задачи" description="Сообщать об изменениях созданных задач."><UiCheckbox label="Email-уведомления" /></UiField>
            </UiFieldGroup>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Choice Card</h3></template>
            <UiFieldset legend="Среда вычислений" legend-variant="label" description="Выберите окружение для кластера.">
              <UiRadioGroup v-model="radioPlan" variant="cards" :options="[{label: 'Kubernetes', value: 'kubernetes', description: 'Запуск GPU-нагрузок в K8s.'}, {label: 'Virtual Machine', value: 'virtual-machine', description: 'Доступ к отдельной виртуальной машине.'}]" />
            </UiFieldset>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'form'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiForm>
              <UiField id="form-name" label="Название проекта"><UiInput id="form-name" placeholder="Mecorion Cloud" /></UiField>
              <UiField id="form-description" label="Описание"><UiTextarea id="form-description" placeholder="Кратко опишите проект" /></UiField>
              <template #actions><UiButton type="submit">Создать проект</UiButton><UiButton type="button" variant="ghost">Отмена</UiButton></template>
            </UiForm>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Server Error</h3></template>
            <UiForm error="Сервер временно недоступен. Повторите попытку позже.">
              <UiField id="form-error-email" label="Email"><UiInput id="form-error-email" type="email" model-value="user@mecorion.dev" /></UiField>
              <template #actions><UiButton type="submit">Повторить</UiButton></template>
            </UiForm>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Loading</h3></template>
            <UiForm loading>
              <UiField id="form-loading-email" label="Email"><UiInput id="form-loading-email" model-value="user@mecorion.dev" /></UiField>
              <UiField id="form-loading-password" label="Пароль"><UiInput id="form-loading-password" type="password" model-value="password" /></UiField>
              <template #actions="{loading}"><UiButton type="submit" :loading="loading">Сохранение</UiButton></template>
            </UiForm>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <UiForm disabled>
              <UiField id="form-disabled-name" label="Профиль"><UiInput id="form-disabled-name" model-value="Иван Иванов" /></UiField>
              <UiCheckbox model-value label="Получать уведомления" />
              <template #actions><UiButton type="submit">Сохранить</UiButton></template>
            </UiForm>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Composition</h3></template>
            <UiForm spacing="lg">
              <template #header><div><h3 class="mc-title-3">Настройки аккаунта</h3><p class="mc-text-sm">Измените основные данные и параметры уведомлений.</p></div></template>
              <UiFieldGroup><UiField id="form-profile-name" label="Имя"><UiInput id="form-profile-name" model-value="Иван" /></UiField><UiField id="form-profile-email" label="Email"><UiInput id="form-profile-email" type="email" model-value="ivan@mecorion.dev" /></UiField></UiFieldGroup>
              <template #actions><UiButton type="submit">Сохранить</UiButton><UiButton type="reset" variant="outline">Сбросить</UiButton></template>
              <template #footer><span class="mc-text-sm">Изменения применятся ко всем сервисам Mecorion.</span></template>
            </UiForm>
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'file-picker'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <UiFilePicker v-model="singleFile" hint="Максимальный размер зависит от настроек формы." />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Multiple</h3></template>
            <UiFilePicker v-model="multipleFiles" multiple :max-files="5" label="Загрузить материалы" description="До пяти файлов за один раз" hint="Выбранные файлы можно удалить из списка." />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Images</h3></template>
            <UiFilePicker v-model="imageFiles" multiple accept="image/png,image/jpeg,image/webp" :max-size="5 * 1024 * 1024" label="Добавить изображения" description="PNG, JPEG или WebP до 5 МБ" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Document</h3></template>
            <UiFilePicker v-model="documentFile" accept=".pdf,.doc,.docx" :max-size="10 * 1024 * 1024" label="Добавить документ" description="PDF, DOC или DOCX до 10 МБ" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Button</h3></template>
            <UiFilePicker v-model="compactFiles" variant="button" multiple label="Выбрать файлы" description="Компактный вариант без dropzone" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Invalid</h3></template>
            <UiFilePicker error="Необходимо прикрепить хотя бы один файл." label="Обязательное вложение" />
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Disabled</h3></template>
            <UiFilePicker disabled label="Загрузка недоступна" description="Файлы нельзя добавить в текущем состоянии" />
          </UiCard>
        </section>
        <section v-else-if="activeCategory === 'textarea'" class="uikit-demo-grid">
          <UiCard><template #header><h3 class="mc-title-3">Состояния</h3></template><UiTextarea v-model="textareaValue" label="Описание" placeholder="Расскажите о пространстве" hint="Поддерживает многострочный текст" /><UiTextarea label="Успешная проверка" success="Описание заполнено корректно" model-value="Готовое описание пространства." /><UiTextarea label="Ошибка" danger="Описание должно содержать не менее 20 символов" model-value="Коротко" /></UiCard>
          <UiCard><UiTextarea label="Только чтение" model-value="Компонент принимает стандартные HTML-атрибуты." readonly /></UiCard>
        </section>
        <section v-else-if="activeCategory === 'select'" class="uikit-demo-grid"><UiCard><template #header><h3 class="mc-title-3">Основной</h3></template><UiSelect v-model="selectValue" label="Сервис" :options="[{label: 'Music', value: 'music'}, {label: 'Video', value: 'video'}, {label: 'Books', value: 'books'}]" /></UiCard><UiCard><template #header><h3 class="mc-title-3">Small</h3></template><UiSelect v-model="selectValue" size="sm" label="Компактный select" :options="[{label: 'Music', value: 'music'}, {label: 'Video', value: 'video'}, {label: 'Books', value: 'books'}]" /></UiCard><UiCard><template #header><h3 class="mc-title-3">Scrollable</h3></template><UiSelect v-model="scrollableSelectValue" label="Большой список" :options="manySelectOptions" scrollable /></UiCard><UiCard><template #header><h3 class="mc-title-3">Invalid</h3></template><UiSelect label="Обязательное поле" placeholder="Выберите сервис" invalid="Выберите один из доступных сервисов" :options="[{label: 'Music', value: 'music'}, {label: 'Video', value: 'video'}]" /></UiCard></section>
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
        <section v-else-if="activeCategory === 'spinner'" class="uikit-demo-grid">
          <UiCard>
            <template #header><h3 class="mc-title-3">Basic</h3></template>
            <div class="mc-row"><UiSpinner /></div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Размеры</h3></template>
            <div class="mc-row">
              <UiSpinner size="xs" label="Очень маленькая загрузка" />
              <UiSpinner size="sm" label="Маленькая загрузка" />
              <UiSpinner label="Загрузка" />
              <UiSpinner size="lg" label="Большая загрузка" />
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Button</h3></template>
            <div class="mc-row">
              <UiButton loading>Загрузка...</UiButton>
              <UiButton><UiSpinner size="sm" decorative /> Подождите</UiButton>
              <UiButton>Обработка <UiSpinner size="sm" decorative /></UiButton>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Badge</h3></template>
            <div class="mc-row">
              <UiBadge loading>Синхронизация</UiBadge>
              <UiBadge><UiSpinner size="xs" decorative /> Обновление</UiBadge>
              <UiBadge>Обработка <UiSpinner size="xs" decorative /></UiBadge>
            </div>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Input</h3></template>
            <UiInput label="Сообщение" placeholder="Отправить сообщение...">
              <template #suffix><UiSpinner size="sm" label="Проверка сообщения" /></template>
            </UiInput>
          </UiCard>
          <UiCard>
            <template #header><h3 class="mc-title-3">Empty state</h3></template>
            <div class="ui-spinner-empty">
              <UiSpinner size="lg" />
              <strong>Обрабатываем ваш запрос</strong>
              <span class="mc-text-sm">Пожалуйста, не закрывайте страницу.</span>
              <UiButton size="sm">Отменить</UiButton>
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
