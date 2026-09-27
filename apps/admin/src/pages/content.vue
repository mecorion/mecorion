<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Каталог"});

type RefItem = {code: string; name: string};
type ContentItem = {id: string; originalTitle: string; releaseDate: string | null; durationMs: number | null; metadata: Record<string, unknown>; type: string; status: string};
type Contributor = {id: string; primaryName: string; normalizedName: string; description: string | null; kind: string};
type References = {types: RefItem[]; statuses: RefItem[]; contributorKinds: RefItem[]; contributorRoles: RefItem[]; languages: RefItem[]};

const client = useAdminClient();
const content = ref<ContentItem[]>([]);
const contributors = ref<Contributor[]>([]);
const references = ref<References>({types: [], statuses: [], contributorKinds: [], contributorRoles: [], languages: []});
const query = ref("");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const contentOpen = ref(false);
const contributorOpen = ref(false);
const linkOpen = ref(false);
const editingContentId = ref("");
const editingContributorId = ref("");
const linkContentId = ref("");
const contentForm = reactive({typeCode: "", statusCode: "DRAFT", originalTitle: "", originalLanguageCode: "", releaseDate: "", durationMs: "", metadata: "{}"});
const contributorForm = reactive({kindCode: "PERSON", primaryName: "", normalizedName: "", description: ""});
const linkForm = reactive({contributorId: "", roleCode: "", characterName: ""});

const options = (items: RefItem[]) => items.map((item) => ({label: item.name, value: item.code}));
const contributorOptions = computed(() => contributors.value.map((item) => ({label: item.primaryName, value: item.id})));

async function load() {
  loading.value = true; error.value = "";
  try {
    const suffix = query.value ? `?limit=100&q=${encodeURIComponent(query.value)}` : "?limit=100";
    const [contentResponse, contributorResponse, referenceResponse] = await Promise.all([
      client.request<{items: ContentItem[]}>(`/api/v1/content${suffix}`),
      client.request<{items: Contributor[]}>(`/api/v1/contributors${suffix}`),
      client.request<References>("/api/v1/admin/content/references"),
    ]);
    content.value = contentResponse.items; contributors.value = contributorResponse.items; references.value = referenceResponse;
    if (!contentForm.typeCode) contentForm.typeCode = referenceResponse.types[0]?.code || "";
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить каталог"; }
  finally { loading.value = false; }
}

function newContent() {
  editingContentId.value = "";
  Object.assign(contentForm, {typeCode: references.value.types[0]?.code || "", statusCode: "DRAFT", originalTitle: "", originalLanguageCode: "", releaseDate: "", durationMs: "", metadata: "{}"});
  contentOpen.value = true;
}
function editContent(item: ContentItem) {
  editingContentId.value = item.id;
  Object.assign(contentForm, {typeCode: item.type, statusCode: item.status, originalTitle: item.originalTitle, originalLanguageCode: "", releaseDate: item.releaseDate?.slice(0, 10) || "", durationMs: item.durationMs ? String(item.durationMs) : "", metadata: JSON.stringify(item.metadata, null, 2)});
  contentOpen.value = true;
}
function newContributor() {
  editingContributorId.value = "";
  Object.assign(contributorForm, {kindCode: "PERSON", primaryName: "", normalizedName: "", description: ""});
  contributorOpen.value = true;
}
function editContributor(item: Contributor) {
  editingContributorId.value = item.id;
  Object.assign(contributorForm, {kindCode: item.kind, primaryName: item.primaryName, normalizedName: item.normalizedName, description: item.description || ""});
  contributorOpen.value = true;
}
function openLink(item: ContentItem) {
  linkContentId.value = item.id;
  Object.assign(linkForm, {contributorId: contributors.value[0]?.id || "", roleCode: references.value.contributorRoles[0]?.code || "", characterName: ""});
  linkOpen.value = true;
}

async function mutate(action: () => Promise<unknown>, close: () => void) {
  saving.value = true; error.value = "";
  try { await action(); close(); await load(); }
  catch (caught: any) { error.value = caught.message || "Операция не выполнена"; }
  finally { saving.value = false; }
}
function saveContent() {
  let metadata: Record<string, unknown>;
  try { metadata = JSON.parse(contentForm.metadata || "{}"); } catch { error.value = "Metadata должна быть корректным JSON-объектом"; return; }
  const body = {typeCode: contentForm.typeCode, statusCode: contentForm.statusCode, originalTitle: contentForm.originalTitle, originalLanguageCode: contentForm.originalLanguageCode || undefined, releaseDate: contentForm.releaseDate || null, durationMs: contentForm.durationMs ? Number(contentForm.durationMs) : null, metadata};
  const path = editingContentId.value ? `/api/v1/admin/content/${editingContentId.value}` : "/api/v1/admin/content";
  return mutate(() => client.request(path, {method: editingContentId.value ? "PATCH" : "POST", body: JSON.stringify(body)}), () => contentOpen.value = false);
}
function saveContributor() {
  const body = {...contributorForm, normalizedName: contributorForm.normalizedName || contributorForm.primaryName.toLowerCase(), description: contributorForm.description || null};
  const path = editingContributorId.value ? `/api/v1/admin/contributors/${editingContributorId.value}` : "/api/v1/admin/contributors";
  return mutate(() => client.request(path, {method: editingContributorId.value ? "PATCH" : "POST", body: JSON.stringify(body)}), () => contributorOpen.value = false);
}
function saveLink() {
  return mutate(() => client.request(`/api/v1/admin/content/${linkContentId.value}/contributors`, {method: "POST", body: JSON.stringify({...linkForm, characterName: linkForm.characterName || null})}), () => linkOpen.value = false);
}
onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Content catalog</p><h1 class="text-title">Каталог</h1><p class="text-subtitle">Канонические объекты контента и связанные с ними участники.</p></div><div class="admin-actions"><UiButton variant="outline" @click="newContributor">Добавить участника</UiButton><UiButton variant="primary" @click="newContent">Добавить контент</UiButton></div></header>
    <UiCard title="Поиск"><div class="admin-toolbar"><UiInput v-model="query" label="Название или участник" placeholder="Введите запрос" @keyup.enter="load" /><UiButton variant="primary" :loading="loading" @click="load">Найти</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка каталога…" />
    <template v-else>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Content</p><h2>Объекты контента</h2></div><span class="text-caption">{{ content.length }} объектов</span></div><UiEmptyState v-if="!content.length" title="Контент не найден" /><div v-else class="admin-list"><UiCard v-for="item in content" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.originalTitle }}</h3><div class="admin-meta"><span class="mc-chip">{{ item.type }}</span><span class="mc-chip">{{ item.status }}</span></div></div><p class="mc-text-sm">{{ item.releaseDate || "Дата не указана" }}</p><div class="admin-actions"><UiButton size="sm" variant="ghost" @click="openLink(item)">Участник</UiButton><UiButton size="sm" variant="outline" @click="editContent(item)">Изменить</UiButton></div></UiCard></div></section>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Contributors</p><h2>Участники</h2></div><span class="text-caption">{{ contributors.length }} участников</span></div><UiEmptyState v-if="!contributors.length" title="Участники не найдены" /><div v-else class="admin-list"><UiCard v-for="item in contributors" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.primaryName }}</h3><p class="mc-text-sm">{{ item.description || "Описание не задано" }}</p></div><span class="mc-chip">{{ item.kind }}</span><UiButton size="sm" variant="outline" @click="editContributor(item)">Изменить</UiButton></UiCard></div></section>
    </template>

    <UiDialog v-model="contentOpen" :title="editingContentId ? 'Изменить контент' : 'Новый объект контента'" size="lg"><UiForm :loading="saving" :error="error" @submit="saveContent"><div class="mc-form-grid"><UiInput v-model="contentForm.originalTitle" label="Название" required /><UiSelect v-model="contentForm.typeCode" label="Тип" :options="options(references.types)" :disabled="Boolean(editingContentId)" /><UiSelect v-model="contentForm.statusCode" label="Статус" :options="options(references.statuses)" /><UiSelect v-model="contentForm.originalLanguageCode" label="Язык оригинала" :options="[{label: 'Не указан', value: ''}, ...options(references.languages)]" /><UiInput v-model="contentForm.releaseDate" label="Дата выпуска" type="date" /><UiInput v-model="contentForm.durationMs" label="Длительность, мс" type="number" /></div><UiTextarea v-model="contentForm.metadata" label="Metadata JSON" rows="5" /><template #actions><UiButton variant="ghost" @click="contentOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="contributorOpen" :title="editingContributorId ? 'Изменить участника' : 'Новый участник'" size="lg"><UiForm :loading="saving" :error="error" @submit="saveContributor"><div class="mc-form-grid"><UiInput v-model="contributorForm.primaryName" label="Основное имя" required /><UiInput v-model="contributorForm.normalizedName" label="Нормализованное имя" /><UiSelect v-model="contributorForm.kindCode" label="Тип" :options="options(references.contributorKinds)" :disabled="Boolean(editingContributorId)" /></div><UiTextarea v-model="contributorForm.description" label="Описание" rows="4" /><template #actions><UiButton variant="ghost" @click="contributorOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="linkOpen" title="Привязать участника" description="Укажите роль участника в выбранном объекте."><UiForm :loading="saving" :error="error" @submit="saveLink"><UiSelect v-model="linkForm.contributorId" label="Участник" :options="contributorOptions" /><UiSelect v-model="linkForm.roleCode" label="Роль" :options="options(references.contributorRoles)" /><UiInput v-model="linkForm.characterName" label="Персонаж" placeholder="Необязательно" /><template #actions><UiButton variant="ghost" @click="linkOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Привязать</UiButton></template></UiForm></UiDialog>
  </div>
</template>
