<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from '#imports';
import {UiAvatar, UiBadge, UiButton, UiCard, UiDialog, UiForm, UiInput, UiItem, UiItemGroup, UiProgress, UiSelect, UiTextarea, toast} from '@/components/ui/index.js';
import SvgIcon from '@/components/SvgIcon.vue';
import {readAuthSession} from '@/auth/session.js';
import {canAccessPage} from '@/platform/navigation.js';

definePageMeta({workspace:true, requiresAuth:true});
useHead({title:'Мой профиль — Mecorion'});
const route = useRoute();
const router = useRouter();
const user = readAuthSession()?.user;
const isDev = import.meta.dev;
const topics = [{id:'music',label:'Музыка',icon:'music'}, {id:'video',label:'Кино и сериалы',icon:'play'}, {id:'books',label:'Книги',icon:'book'}, {id:'course',label:'Обучение',icon:'graduation-cap'}, {id:'spaces',label:'Сообщества',icon:'users'}, {id:'technology',label:'Технологии',icon:'grid'}];
const preferences = ref({name:user?.displayName || user?.username || '', bio:'', interests:[]});
const editOpen = ref(false);
const formError = ref('');
const draft = reactive({name:'',bio:''});
const storageKey = `mecorion.profile.preferences.${user?.id || 'local'}`;
const initials = computed(() => preferences.value.name.split(/\s+/).filter(Boolean).map(part=>part[0]).join('').slice(0,2).toUpperCase() || 'M');
const completionSteps = computed(() => [{title:'Ваше имя',text:'Как к вам обращаться',done:Boolean(preferences.value.name.trim())}, {title:'Несколько слов о себе',text:'То, что вы хотите рассказать',done:Boolean(preferences.value.bio.trim())}, {title:'Ваши интересы',text:'Темы, которые вам близки',done:preferences.value.interests.length>0}]);
const progress = computed(() => Math.round(completionSteps.value.filter(step=>step.done).length / completionSteps.value.length * 100));
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Не определён';
const previewRole = computed({get:()=>['agent','moderator'].includes(String(route.query.role)) ? String(route.query.role) : 'user', set:role=>router.replace({query:{...route.query,role:role==='user'?undefined:role}})});
const previewOptions = [{value:'user',label:'Пользователь'}, {value:'agent',label:'Агент'}, {value:'moderator',label:'Модератор'}];
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!saved || typeof saved !== 'object') return;
    preferences.value = {
      name:typeof saved.name==='string' ? saved.name.slice(0,80) : preferences.value.name,
      bio:typeof saved.bio==='string' ? saved.bio.slice(0,280) : '',
      interests:Array.isArray(saved.interests) ? [...new Set(saved.interests.filter(id=>topics.some(topic=>topic.id===id)))] : [],
    };
  } catch { /* Profile remains usable when browser storage is unavailable. */ }
});
function persist(next) {localStorage.setItem(storageKey, JSON.stringify(next));preferences.value=next;}
function openEditor() {draft.name=preferences.value.name;draft.bio=preferences.value.bio;formError.value='';editOpen.value=true;}
function saveProfile() {
  if (!draft.name.trim()) {formError.value='Введите имя, чтобы сохранить профиль.';return;}
  try {persist({...preferences.value,name:draft.name.trim().slice(0,80),bio:draft.bio.trim().slice(0,280)});editOpen.value=false;toast.add({type:'success',title:'Профиль сохранён на этом устройстве'});}
  catch {formError.value='Браузер не разрешил сохранить профиль. Проверьте доступ к локальному хранилищу и попробуйте ещё раз.';}
}
function toggleInterest(id) {
  const interests=preferences.value.interests.includes(id) ? preferences.value.interests.filter(item=>item!==id) : [...preferences.value.interests,id];
  try {persist({...preferences.value,interests});}
  catch {toast.add({type:'error',title:'Не удалось сохранить интересы',description:'Браузер не разрешил запись в локальное хранилище.'});}
}
async function copyId() {
  if (!user?.id) return;
  try {await navigator.clipboard.writeText(user.id);toast.add({type:'success',title:'Mecorion ID скопирован'});}
  catch {toast.add({type:'error',title:'Не удалось скопировать ID',description:'Выделите и скопируйте его вручную.'});}
}
</script>

<template>
  <main class="account-profile">
    <header class="account-profile__heading"><div><p class="account-profile__eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</p><h1>Мой профиль</h1><p>Всё о вас и вашем аккаунте Mecorion.</p></div><UiButton variant="primary" @click="openEditor"><SvgIcon name="user" />Редактировать профиль</UiButton></header>
    <UiCard raw class="account-profile__identity">
      <div class="account-profile__cover" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="account-profile__identity-body">
        <UiAvatar :fallback="initials" :alt="preferences.name || 'Ваш профиль'" size="lg" class="account-profile__avatar" />
        <div class="account-profile__identity-copy"><UiBadge variant="soft">Единый аккаунт</UiBadge><h2>{{ preferences.name || 'Ваше имя' }}</h2><p v-if="user?.username" class="account-profile__username">@{{ user.username }}</p><p>{{ preferences.bio || 'Расскажите немного о себе — о том, что вас вдохновляет и чем вы любите заниматься.' }}</p></div>
        <div class="account-profile__id"><span>Mecorion ID</span><template v-if="user?.id"><strong>{{ user.id }}</strong><UiButton variant="outline" @click="copyId">Скопировать ID</UiButton></template><p v-else>Доступен после входа в аккаунт.</p></div>
      </div>
    </UiCard>

    <div class="account-profile__layout">
      <div class="account-profile__main">
        <UiCard raw class="account-profile__panel account-profile__details-panel">
          <div class="account-profile__panel-heading"><span class="account-profile__icon"><SvgIcon name="user" /></span><div><h2>Личные сведения</h2><p>Ваш профиль в экосистеме.</p></div><UiButton variant="ghost" @click="openEditor">Изменить</UiButton></div>
          <dl class="account-profile__details"><div><dt>Имя</dt><dd>{{ preferences.name || 'Пока не добавлено' }}</dd></div><div><dt>О себе</dt><dd>{{ preferences.bio || 'Добавьте несколько слов о себе' }}</dd></div><div><dt>Язык страницы</dt><dd>Русский</dd></div><div><dt>Часовой пояс устройства</dt><dd>{{ timezone }}</dd></div></dl>
          <p class="account-profile__note">Имя, описание и интересы сохраняются в этом браузере. Синхронизация с аккаунтом пока не подключена.</p>
        </UiCard>
        <UiCard raw class="account-profile__panel account-profile__interests-panel">
          <div class="account-profile__panel-heading"><span class="account-profile__icon"><SvgIcon name="heart" /></span><div><h2>То, что вам близко</h2><p>Выберите интересы. Их можно изменить в любой момент.</p></div></div>
          <div class="account-profile__interests" role="group" aria-label="Ваши интересы"><UiButton v-for="topic in topics" :key="topic.id" :variant="preferences.interests.includes(topic.id) ? 'primary' : 'outline'" :aria-pressed="preferences.interests.includes(topic.id)" @click="toggleInterest(topic.id)"><SvgIcon :name="topic.icon" />{{ topic.label }}</UiButton></div>
          <p class="account-profile__note" role="status">{{ preferences.interests.length ? `Выбрано интересов: ${preferences.interests.length}` : 'Выберите одну или несколько тем.' }}</p>
        </UiCard>
        <UiCard v-if="canAccessPage('settings')" raw class="account-profile__panel account-profile__appearance"><span class="account-profile__icon"><SvgIcon name="settings" /></span><div><h2>Комфорт в деталях</h2><p>Выберите светлую или тёмную тему, чтобы Mecorion подходил вашему ритму.</p></div><UiButton variant="outline" to="/settings">Настройки<SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
      </div>
      <aside class="account-profile__aside" aria-label="Настройка и управление аккаунтом">
        <UiCard raw class="account-profile__panel account-profile__completion"><div><p class="account-profile__eyebrow">ЗНАКОМСТВО С ВАМИ</p><h2>{{ progress === 100 ? 'Профиль заполнен' : 'Сделайте профиль своим' }}</h2></div><UiProgress :value="progress" label="Заполнение профиля" show-value /><UiItemGroup><UiItem v-for="step in completionSteps" :key="step.title" :title="step.title" :description="step.text"><template #media><SvgIcon :name="step.done ? 'badge-check' : 'plus'" :class="{'account-profile__done':step.done}" /></template></UiItem></UiItemGroup><UiButton variant="outline" @click="openEditor">{{ progress === 100 ? 'Обновить сведения' : 'Добавить сведения' }}</UiButton></UiCard>
        <UiCard raw class="account-profile__panel account-profile__security"><span class="account-profile__icon"><SvgIcon name="shield" /></span><div class="account-profile__security-copy"><h2>Аккаунт под вашим контролем</h2><p>Seed phrase используется для входа. Храните её в надёжном месте и не передавайте другим людям.</p></div><UiButton v-if="canAccessPage('support')" variant="outline" to="/support">Нужна помощь?<SvgIcon name="arrow-up-right-1" /></UiButton></UiCard>
        <UiItemGroup class="account-profile__links"><UiCard v-if="canAccessPage('home')" raw interactive to="/dashboard" class="account-profile__shortcut"><UiItem title="Главная" description="Вернуться к вашим сервисам"><template #media><span class="account-profile__icon"><SvgIcon name="home" /></span></template><template #actions><SvgIcon name="arrow-up-right-1" /></template></UiItem></UiCard><UiCard v-if="canAccessPage('saved')" raw interactive to="/saved" class="account-profile__shortcut"><UiItem title="Сохранённое" description="Важное всегда рядом"><template #media><span class="account-profile__icon"><SvgIcon name="star" /></span></template><template #actions><SvgIcon name="arrow-up-right-1" /></template></UiItem></UiCard></UiItemGroup>
      </aside>
    </div>
    <UiCard v-if="isDev" raw class="account-profile__preview"><div><UiBadge>Предпросмотр</UiBadge><p>Демонстрационные роли не изменяют права аккаунта.</p></div><UiSelect v-model="previewRole" label="Роль в прототипе" :options="previewOptions" /><p v-if="previewRole !== 'user'">{{ previewRole === 'agent' ? 'Агент курирует контент и тематические пространства.' : 'Модератор рассматривает обращения и помогает поддерживать правила сообщества.' }} Рабочие инструменты зависят от разрешений аккаунта.</p></UiCard>
    <UiDialog v-model="editOpen" title="Редактировать профиль" description="Эти сведения сохраняются только в этом браузере." size="md">
      <UiForm id="profile-edit-form" :error="formError" error-title="Проверьте профиль" @submit="saveProfile"><UiInput v-model="draft.name" label="Имя" placeholder="Как к вам обращаться" maxlength="80" autocomplete="nickname" autofocus required /><UiTextarea v-model="draft.bio" label="О себе" placeholder="Интересы, увлечения или несколько слов о вас" :hint="`${draft.bio.length} / 280 символов`" maxlength="280" rows="4" /></UiForm>
      <template #footer><div class="account-profile__editor-actions"><UiButton variant="ghost" @click="editOpen=false">Отмена</UiButton><UiButton variant="primary" type="submit" form="profile-edit-form">Сохранить</UiButton></div></template>
    </UiDialog>
  </main>
</template>
