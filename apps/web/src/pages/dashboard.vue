<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiInput, UiItem, UiItemGroup} from '@/components/ui/index.js';
import SvgIcon from '@/components/SvgIcon.vue';
import {readAuthSession} from '@/auth/session.js';
import {canAccessPage} from '@/platform/navigation.js';
import musicArt from '@/assets/illustrations/dashboard/music-bars.svg';
import videoArt from '@/assets/illustrations/dashboard/video-wave.svg';
import booksArt from '@/assets/illustrations/dashboard/books.svg';

definePageMeta({workspace: true, requiresAuth: true});
useHead({title: 'Главная — Mecorion'});
const user = readAuthSession()?.user;
const name = user?.displayName || user?.username || '';
const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'M';
const query = ref('');
const view = ref('all');
const pinned = ref([]);
const preferencesReady = ref(false);
const storageNotice = ref('');
const storageKey = `mecorion.dashboard.pinned.${user?.id || 'local'}`;
const services = [
  {id: 'music', title: 'Music', text: 'Любимые треки, плейлисты и ваша локальная музыка.', icon: 'music', route: '/music', category: 'content', tone: 'rose'},
  {id: 'video', title: 'Video', text: 'Фильмы, сериалы и новые истории.', icon: 'play', route: '/video', category: 'content', tone: 'cyan'},
  {id: 'books', title: 'Books', text: 'Книги, заметки и идеи для вдохновения.', icon: 'book', route: '/books', category: 'content', tone: 'gold'},
  {id: 'course', title: 'Course', text: 'Новые знания и пространство для развития.', icon: 'graduation-cap', route: '/course', category: 'content', tone: 'violet'},
  {id: 'spaces', title: 'Spaces', text: 'Люди и контент, объединённые интересами.', icon: 'boxes', route: '/spaces', category: 'tools', tone: 'rose'},
  {id: 'drive', title: 'Drive', text: 'Пространство для ваших файлов.', icon: 'cloud', route: '/drive', category: 'tools', tone: 'cyan'},
  {id: 'vpn', title: 'VPN', text: 'Инструменты для приватного подключения.', icon: 'shield', route: '/vpn', category: 'tools', tone: 'green'},
];
const availableServices = computed(() => services.filter(service => canAccessPage(service.id)));
const visibleServices = computed(() => availableServices.value.filter(service => {
  const matchesView = view.value === 'all' || (view.value === 'pinned' ? pinned.value.includes(service.id) : service.category === view.value);
  return matchesView && `${service.title} ${service.text}`.toLocaleLowerCase('ru').includes(query.value.trim().toLocaleLowerCase('ru'));
}).sort((a,b) => Number(pinned.value.includes(b.id)) - Number(pinned.value.includes(a.id))));
const emptyState = computed(() => {
  if (!availableServices.value.length) return {title:'Ваши сервисы появятся здесь', description:'На главной отображаются сервисы, доступные вашему аккаунту.'};
  if (view.value === 'pinned' && !query.value.trim()) return {title:'Любимые сервисы — ближе', description:'Нажмите на звезду у сервиса, чтобы закрепить его здесь.'};
  return {title:'Сервисы не найдены', description:'Попробуйте другое название или вернитесь ко всем доступным сервисам.'};
});
const filters = [{id:'all',label:'Все'}, {id:'pinned',label:'Закреплённые'}, {id:'content',label:'Контент'}, {id:'tools',label:'Инструменты'}];
const discoveries = computed(() => [
  {id:'music', title:'Пусть день звучит по-вашему', text:'Найдите музыку под настроение или включите свою коллекцию.', label:'Открыть Music', route:'/music', art:musicArt, tone:'rose'},
  {id:'video', title:'Время для новой истории', text:'Загляните в медиатеку и выберите, что посмотреть.', label:'Открыть медиатеку', route:'/video/library', art:videoArt, tone:'cyan'},
  {id:'books', title:'Откройте следующую главу', text:'Найдите книгу, с которой захочется провести вечер.', label:'Открыть Books', route:'/books', art:booksArt, tone:'gold'},
].filter(item => canAccessPage(item.id)));
function togglePinned(id) {
  pinned.value = pinned.value.includes(id) ? pinned.value.filter(item => item !== id) : [...pinned.value, id];
}
function resetFilters() {query.value=''; view.value='all';}
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) pinned.value = [...new Set(saved.filter(id => services.some(service => service.id === id)))];
  } catch { /* An unavailable or stale preference does not prevent navigation. */ }
  preferencesReady.value = true;
});
watch(pinned, value => {
  if (!preferencesReady.value) return;
  try {localStorage.setItem(storageKey, JSON.stringify(value)); storageNotice.value='';}
  catch {storageNotice.value='Закрепление работает в этой вкладке. Браузер не разрешил сохранить его для следующего посещения.';}
});
</script>

<template>
  <main class="home-dashboard">
    <header class="home-dashboard__welcome">
      <div>
        <p class="home-dashboard__eyebrow">ВАШ MECORION</p>
        <h1>{{ name ? `Рады видеть вас, ${name}` : 'Всё ваше. В одном месте.' }}</h1>
        <p class="home-dashboard__lead">Любимые сервисы, новые открытия и пространство для себя.</p>
      </div>
      <UiButton v-if="canAccessPage('profile')" variant="outline" to="/profile"><SvgIcon name="user" />Мой профиль</UiButton>
    </header>

    <div class="home-dashboard__layout">
      <div class="home-dashboard__main">
        <section aria-labelledby="home-services-title" class="home-dashboard__section">
          <div class="home-dashboard__section-heading">
            <div><h2 id="home-services-title">Ваши сервисы</h2><p>Закрепите любимые — они всегда будут первыми.</p></div>
            <UiBadge>{{ availableServices.length }} доступно</UiBadge>
          </div>
          <div class="home-dashboard__toolbar">
            <div class="home-dashboard__filters" role="group" aria-label="Категории сервисов">
              <UiButton v-for="filter in filters" :key="filter.id" :variant="view === filter.id ? 'primary' : 'ghost'" :aria-pressed="view === filter.id" @click="view = filter.id">{{ filter.label }}</UiButton>
            </div>
            <UiInput v-model="query" size="md" clearable aria-label="Поиск сервисов" placeholder="Найти сервис" type="search"><template #prefix><SvgIcon name="search" /></template></UiInput>
          </div>
          <p v-if="storageNotice" class="home-dashboard__notice" role="status">{{ storageNotice }}</p>
          <div v-if="visibleServices.length" class="home-dashboard__services" :data-count="visibleServices.length">
            <UiCard v-for="service in visibleServices" :key="service.id" raw class="home-dashboard__service" :class="`home-dashboard__tone--${service.tone}`">
              <div class="home-dashboard__service-top">
                <div class="home-dashboard__service-heading"><span class="home-dashboard__service-icon"><SvgIcon :name="service.icon" /></span><div><span class="home-dashboard__service-category">{{ service.category === 'content' ? 'Для вдохновения' : 'Для ваших задач' }}</span><h3>{{ service.title }}</h3></div></div>
                <UiButton variant="ghost" icon :aria-label="`${pinned.includes(service.id) ? 'Открепить' : 'Закрепить'} ${service.title}`" :aria-pressed="pinned.includes(service.id)" @click="togglePinned(service.id)"><SvgIcon name="star" :class="{'home-dashboard__star--active':pinned.includes(service.id)}" /></UiButton>
              </div>
              <SvgIcon :name="service.icon" class="home-dashboard__service-art" /><p>{{ service.text }}</p>
              <UiButton variant="ghost" :to="service.route" :aria-label="`Открыть ${service.title}`" class="home-dashboard__service-link">Открыть<SvgIcon name="arrow-up-right-1" /></UiButton>
            </UiCard>
          </div>
          <UiCard v-else raw>
            <UiEmptyState :title="emptyState.title" :description="emptyState.description">
              <template #media><SvgIcon :name="view === 'pinned' ? 'star' : 'search'" /></template>
              <template v-if="availableServices.length" #actions><UiButton variant="outline" @click="resetFilters">Показать все</UiButton></template>
            </UiEmptyState>
          </UiCard>
        </section>

        <section v-if="discoveries.length" class="home-dashboard__section" aria-labelledby="home-discover-title">
          <div class="home-dashboard__section-heading"><div><p class="home-dashboard__eyebrow">В ВАШЕМ РИТМЕ</p><h2 id="home-discover-title">Чем займёмся сегодня?</h2></div></div>
          <div class="home-dashboard__discoveries">
            <UiCard v-for="item in discoveries" :key="item.id" raw class="home-dashboard__discovery" :class="`home-dashboard__tone--${item.tone}`">
              <div class="home-dashboard__art"><img :src="item.art" alt="" /></div>
              <div class="home-dashboard__discovery-copy"><h3>{{ item.title }}</h3><p>{{ item.text }}</p><UiButton variant="outline" :to="item.route">{{ item.label }}<SvgIcon name="arrow-up-right-1" /></UiButton></div>
            </UiCard>
          </div>
        </section>

        <UiCard v-if="canAccessPage('spaces')" raw class="home-dashboard__spaces">
          <span class="home-dashboard__service-icon"><SvgIcon name="boxes" /></span>
          <div><p class="home-dashboard__eyebrow">БОЛЬШЕ ОБЩЕГО</p><h2>Найдите своё пространство</h2><p>Откройте сообщества и коллекции вокруг того, что вам интересно.</p></div>
          <UiButton variant="primary" to="/spaces">Исследовать<SvgIcon name="arrow-up-right-1" /></UiButton>
        </UiCard>
      </div>

      <aside class="home-dashboard__aside" aria-label="Аккаунт и полезные действия">
        <UiCard raw class="home-dashboard__account">
          <div class="home-dashboard__account-heading"><UiAvatar :fallback="initials" :alt="name || 'Ваш аккаунт'" size="lg" /><div><p class="home-dashboard__eyebrow">ЕДИНЫЙ АККАУНТ</p><h2>{{ name || 'Ваш профиль' }}</h2><p v-if="user?.username">@{{ user.username }}</p></div></div>
          <p>Один профиль для всех сервисов Mecorion.</p>
          <UiButton v-if="canAccessPage('profile')" variant="outline" to="/profile">Настроить профиль<SvgIcon name="arrow-up-right-1" /></UiButton>
        </UiCard>
        <UiCard v-if="canAccessPage('settings')" raw class="home-dashboard__help">
          <span class="home-dashboard__service-icon"><SvgIcon name="settings" /></span><h2>Сделайте Mecorion своим</h2><p>Выберите удобную тему оформления в настройках.</p><UiButton variant="ghost" to="/settings">Открыть настройки<SvgIcon name="arrow-up-right-1" /></UiButton>
        </UiCard>
        <UiCard v-if="canAccessPage('music')" raw class="home-dashboard__help">
          <UiBadge variant="soft">ВАША КОЛЛЕКЦИЯ</UiBadge><h2>Музыка, которая уже с вами</h2><p>Добавьте локальные треки в Music и слушайте их через единый плеер.</p><UiButton variant="ghost" to="/music">Перейти в Music<SvgIcon name="arrow-up-right-1" /></UiButton>
        </UiCard>
        <UiItemGroup class="home-dashboard__utility">
          <UiItem v-if="canAccessPage('saved')" title="Сохранённое" description="Вернитесь к важному" to="/saved"><template #media><SvgIcon name="star" /></template><template #actions><SvgIcon name="arrow-up-right-1" /></template></UiItem>
          <UiItem v-if="canAccessPage('support')" title="Нужна помощь?" description="Поддержка Mecorion" to="/support"><template #media><SvgIcon name="circle-alert" /></template><template #actions><SvgIcon name="arrow-up-right-1" /></template></UiItem>
        </UiItemGroup>
      </aside>
    </div>
  </main>
</template>
