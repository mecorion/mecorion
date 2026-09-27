<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Публикации"});

type Publication = {id: string; slug: string; title: string; summary: string | null; status: string; publishDtm: string | null; contentCount: number};
type ContentItem = {id: string; originalTitle: string; type: string; status: string};
type RefItem = {code: string; name: string};

const client = useAdminClient();
const publications = ref<Publication[]>([]);
const content = ref<ContentItem[]>([]);
const statuses = ref<RefItem[]>([]);
const search = ref("");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const dialogOpen = ref(false);
const editingId = ref("");
const form = reactive({slug: "", title: "", summary: "", statusCode: "DRAFT", contentIds: [] as string[]});
const statusOptions = computed(() => statuses.value.map((item) => ({label: item.name, value: item.code})));

async function load() {
  loading.value = true; error.value = "";
  try {
    const suffix = search.value ? `?limit=100&q=${encodeURIComponent(search.value)}` : "?limit=100";
    const [publicationResponse, contentResponse, refs] = await Promise.all([
      client.request<{items: Publication[]}>(`/api/v1/publications${suffix}`),
      client.request<{items: ContentItem[]}>("/api/v1/content?limit=100"),
      client.request<{publicationStatuses: RefItem[]}>("/api/v1/admin/content/references"),
    ]);
    publications.value = publicationResponse.items; content.value = contentResponse.items; statuses.value = refs.publicationStatuses;
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить публикации"; }
  finally { loading.value = false; }
}

function createPublication() {
  editingId.value = "";
  Object.assign(form, {slug: "", title: "", summary: "", statusCode: "DRAFT", contentIds: []});
  dialogOpen.value = true;
}
function editPublication(item: Publication) {
  editingId.value = item.id;
  Object.assign(form, {slug: item.slug, title: item.title, summary: item.summary || "", statusCode: item.status, contentIds: []});
  dialogOpen.value = true;
}
async function save() {
  saving.value = true; error.value = "";
  try {
    const path = editingId.value ? `/api/v1/admin/publications/${editingId.value}` : "/api/v1/admin/publications";
    const body = editingId.value
      ? {title: form.title, summary: form.summary || null, statusCode: form.statusCode}
      : {slug: form.slug, title: form.title, summary: form.summary || undefined, statusCode: form.statusCode, contentIds: form.contentIds};
    await client.request(path, {method: editingId.value ? "PATCH" : "POST", body: JSON.stringify(body)});
    dialogOpen.value = false; await load();
  } catch (caught: any) { error.value = caught.message || "Не удалось сохранить публикацию"; }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Publishing</p><h1 class="text-title">Публикации</h1><p class="text-subtitle">Публичные представления объектов каталога: страницы, сборники и карточки сервисов.</p></div><UiButton variant="primary" @click="createPublication">Создать публикацию</UiButton></header>
    <UiCard title="Поиск"><div class="admin-toolbar"><UiInput v-model="search" label="Название или slug" @keyup.enter="load" /><UiButton variant="primary" :loading="loading" @click="load">Найти</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка публикаций…" />
    <UiEmptyState v-else-if="!publications.length" title="Публикации не найдены" description="Создайте черновик и привяжите к нему контент." />
    <section v-else class="admin-list">
      <UiCard v-for="item in publications" :key="item.id" class="admin-list-item" raw>
        <div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">/{{ item.slug }}</p><div class="admin-meta"><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ item.contentCount }} объектов</span></div></div>
        <p class="mc-text-sm">{{ item.publishDtm ? `Опубликовано ${new Date(item.publishDtm).toLocaleDateString('ru-RU')}` : "Не опубликовано" }}</p>
        <UiButton variant="outline" size="sm" @click="editPublication(item)">Изменить</UiButton>
      </UiCard>
    </section>

    <UiDialog v-model="dialogOpen" :title="editingId ? 'Изменить публикацию' : 'Новая публикация'" size="xl" sticky-footer>
      <UiForm :loading="saving" :error="error" @submit="save">
        <div class="mc-form-grid"><UiInput v-model="form.title" label="Название" required /><UiInput v-model="form.slug" label="Slug" placeholder="example-publication" :disabled="Boolean(editingId)" required /><UiSelect v-model="form.statusCode" label="Статус" :options="statusOptions" /></div>
        <UiTextarea v-model="form.summary" label="Краткое описание" rows="4" />
        <div v-if="!editingId" class="mc-stack"><p class="mc-field__label">Состав публикации</p><div class="admin-check-grid mc-scroll"><UiCheckbox v-for="item in content" :key="item.id" v-model="form.contentIds" :value="item.id" :label="item.originalTitle" :description="`${item.type} · ${item.status}`" /></div></div>
        <p v-else class="mc-text-sm">Состав существующей публикации будет редактироваться отдельным упорядоченным редактором на следующей итерации.</p>
        <template #actions><UiButton variant="ghost" @click="dialogOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>
  </div>
</template>
