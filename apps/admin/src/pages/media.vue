<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";

definePageMeta({title: "Медиа"});

type RefItem = {code: string; name: string};
type Upload = {id: string; status: string; expectedSizeByte: string | null; storageObjectId: string | null; createDtm: string; expireDtm: string};
type StorageObject = {id: string; provider: string; status: string; bucketName: string; objectKey: string; sizeByte: string; contentType: string | null};
type Asset = {id: string; type: string; status: string; language: string | null; title: string | null; variantCount: number};
type Variant = {id: string; assetId: string; title: string | null; storageObjectId: string; variantCode: string; codec: string | null; isSource: boolean};
type Job = {id: string; sourceAssetVariantId: string; title: string | null; status: string; profileCode: string; attemptCount: number; lastError: string | null};
type Content = {id: string; originalTitle: string; type: string};
type References = {providers: RefItem[]; assetTypes: RefItem[]; roles: RefItem[]; languages: RefItem[]; territories: RefItem[]};

const client = useAdminClient();
const refs = ref<References>({providers: [], assetTypes: [], roles: [], languages: [], territories: []});
const uploads = ref<Upload[]>([]);
const objects = ref<StorageObject[]>([]);
const assets = ref<Asset[]>([]);
const variants = ref<Variant[]>([]);
const jobs = ref<Job[]>([]);
const content = ref<Content[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const uploadOpen = ref(false);
const completeOpen = ref(false);
const sourceOpen = ref(false);
const attachOpen = ref(false);
const jobOpen = ref(false);
const jobCompleteOpen = ref(false);
const selectedId = ref("");
const zeroHash = "0".repeat(64);
const uploadForm = reactive({expectedSizeByte: "", expectedSha256Hex: ""});
const completeForm = reactive({providerCode: "primary-s3", bucketName: "mecorion", objectKey: "", sizeByte: "0", contentType: "application/octet-stream", sha256Hex: zeroHash});
const sourceForm = reactive({typeCode: "", languageCode: "", title: "", durationMs: "", variantCode: "SOURCE", container: "", codec: ""});
const attachForm = reactive({contentId: "", roleCode: "", territoryCode: "", isPrimary: false, ordinal: ""});
const jobForm = reactive({sourceAssetVariantId: "", profileCode: "VIDEO_HLS_1080P"});
const jobCompleteForm = reactive({providerCode: "primary-s3", bucketName: "mecorion", objectKey: "", sizeByte: "0", contentType: "application/octet-stream", sha256Hex: zeroHash, variantCode: "HLS_1080P", container: "m3u8", codec: "h264"});

const options = (items: RefItem[]) => items.map((item) => ({label: item.name, value: item.code}));
const contentOptions = computed(() => content.value.map((item) => ({label: `${item.originalTitle} · ${item.type}`, value: item.id})));
const sourceVariantOptions = computed(() => variants.value.filter((item) => item.isSource).map((item) => ({label: `${item.title || "Без названия"} · ${item.variantCode}`, value: item.id})));
const bytes = (value: string | null) => value === null ? "Размер не указан" : `${(Number(value) / 1024 / 1024).toFixed(2)} МБ`;

async function load() {
  loading.value = true; error.value = "";
  try {
    const [referenceResponse, uploadResponse, objectResponse, assetResponse, variantResponse, jobResponse, contentResponse] = await Promise.all([
      client.request<References>("/api/v1/admin/media/references"),
      client.request<{items: Upload[]}>("/api/v1/admin/media/uploads?limit=100"),
      client.request<{items: StorageObject[]}>("/api/v1/admin/media/storage-objects?limit=100"),
      client.request<{items: Asset[]}>("/api/v1/admin/media/assets?limit=100"),
      client.request<{items: Variant[]}>("/api/v1/admin/media/asset-variants?limit=100"),
      client.request<{items: Job[]}>("/api/v1/admin/media/transcode-jobs?limit=100"),
      client.request<{items: Content[]}>("/api/v1/content?limit=100"),
    ]);
    refs.value = referenceResponse; uploads.value = uploadResponse.items; objects.value = objectResponse.items;
    assets.value = assetResponse.items; variants.value = variantResponse.items; jobs.value = jobResponse.items; content.value = contentResponse.items;
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить медиаданные"; }
  finally { loading.value = false; }
}

async function mutate(action: () => Promise<unknown>, close?: () => void) {
  saving.value = true; error.value = "";
  try { await action(); close?.(); await load(); }
  catch (caught: any) { error.value = caught.message || "Операция не выполнена"; }
  finally { saving.value = false; }
}

function newUpload() { Object.assign(uploadForm, {expectedSizeByte: "", expectedSha256Hex: ""}); uploadOpen.value = true; }
function completeUpload(item: Upload) {
  selectedId.value = item.id;
  Object.assign(completeForm, {providerCode: refs.value.providers[0]?.code || "primary-s3", bucketName: "mecorion", objectKey: "", sizeByte: item.expectedSizeByte || "0", contentType: "application/octet-stream", sha256Hex: zeroHash});
  completeOpen.value = true;
}
function createSource(item: StorageObject) {
  selectedId.value = item.id;
  Object.assign(sourceForm, {typeCode: refs.value.assetTypes[0]?.code || "", languageCode: "", title: "", durationMs: "", variantCode: "SOURCE", container: "", codec: ""});
  sourceOpen.value = true;
}
function attachAsset(item: Asset) {
  selectedId.value = item.id;
  Object.assign(attachForm, {contentId: content.value[0]?.id || "", roleCode: refs.value.roles[0]?.code || "", territoryCode: "", isPrimary: false, ordinal: ""});
  attachOpen.value = true;
}
function newJob() { Object.assign(jobForm, {sourceAssetVariantId: sourceVariantOptions.value[0]?.value || "", profileCode: "VIDEO_HLS_1080P"}); jobOpen.value = true; }
function completeJob(item: Job) {
  selectedId.value = item.id;
  Object.assign(jobCompleteForm, {providerCode: refs.value.providers[0]?.code || "primary-s3", bucketName: "mecorion", objectKey: "", sizeByte: "0", contentType: "application/octet-stream", sha256Hex: zeroHash, variantCode: item.profileCode, container: "", codec: ""});
  jobCompleteOpen.value = true;
}

const saveUpload = () => mutate(() => client.request("/api/v1/admin/media/uploads", {method: "POST", body: JSON.stringify({expectedSizeByte: uploadForm.expectedSizeByte ? Number(uploadForm.expectedSizeByte) : undefined, expectedSha256Hex: uploadForm.expectedSha256Hex || undefined})}), () => uploadOpen.value = false);
const saveComplete = () => mutate(() => client.request(`/api/v1/admin/media/uploads/${selectedId.value}/complete`, {method: "PATCH", body: JSON.stringify({...completeForm, sizeByte: Number(completeForm.sizeByte)})}), () => completeOpen.value = false);
const saveSource = () => mutate(() => client.request("/api/v1/admin/media/source-assets", {method: "POST", body: JSON.stringify({...sourceForm, storageObjectId: selectedId.value, languageCode: sourceForm.languageCode || undefined, durationMs: sourceForm.durationMs ? Number(sourceForm.durationMs) : undefined, container: sourceForm.container || undefined, codec: sourceForm.codec || undefined})}), () => sourceOpen.value = false);
const saveAttach = () => mutate(() => client.request("/api/v1/admin/media/content-assets", {method: "POST", body: JSON.stringify({...attachForm, assetId: selectedId.value, territoryCode: attachForm.territoryCode || undefined, ordinal: attachForm.ordinal ? Number(attachForm.ordinal) : undefined})}), () => attachOpen.value = false);
const saveJob = () => mutate(() => client.request("/api/v1/admin/media/transcode-jobs", {method: "POST", body: JSON.stringify(jobForm)}), () => jobOpen.value = false);
const saveJobComplete = () => mutate(() => client.request(`/api/v1/admin/media/transcode-jobs/${selectedId.value}/complete`, {method: "POST", body: JSON.stringify({...jobCompleteForm, sizeByte: Number(jobCompleteForm.sizeByte), container: jobCompleteForm.container || undefined, codec: jobCompleteForm.codec || undefined})}), () => jobCompleteOpen.value = false);
const updateJob = (item: Job, statusCode: string) => mutate(() => client.request(`/api/v1/admin/media/transcode-jobs/${item.id}`, {method: "PATCH", body: JSON.stringify({statusCode})}));

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Media pipeline</p><h1 class="text-title">Медиа и обработка</h1><p class="text-subtitle">Сессии загрузки, объекты хранилища, логические assets и очередь media-worker.</p></div><div class="admin-actions"><UiButton variant="outline" @click="newJob">Поставить задачу</UiButton><UiButton variant="primary" @click="newUpload">Новая загрузка</UiButton></div></header>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка медиаконтура…" />
    <template v-else>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Upload sessions</p><h2>Загрузки</h2></div><span class="text-caption">{{ uploads.length }}</span></div><UiEmptyState v-if="!uploads.length" title="Загрузок пока нет" /><div v-else class="admin-list"><UiCard v-for="item in uploads" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.id }}</h3><div class="admin-meta"><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ bytes(item.expectedSizeByte) }}</span></div></div><p class="mc-text-sm">Истекает {{ new Date(item.expireDtm).toLocaleString('ru-RU') }}</p><UiButton v-if="!item.storageObjectId" size="sm" variant="outline" @click="completeUpload(item)">Подтвердить файл</UiButton><span v-else class="text-caption">Объект зарегистрирован</span></UiCard></div></section>

      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Storage</p><h2>Объекты хранилища</h2></div><span class="text-caption">{{ objects.length }}</span></div><UiEmptyState v-if="!objects.length" title="Объекты не зарегистрированы" /><div v-else class="admin-list"><UiCard v-for="item in objects" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.objectKey }}</h3><p class="mc-text-sm">{{ item.provider }} / {{ item.bucketName }} · {{ bytes(item.sizeByte) }}</p></div><span class="mc-chip">{{ item.status }}</span><UiButton size="sm" variant="outline" @click="createSource(item)">Создать asset</UiButton></UiCard></div></section>

      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Assets</p><h2>Медиа-ресурсы</h2></div><span class="text-caption">{{ assets.length }}</span></div><UiEmptyState v-if="!assets.length" title="Assets не созданы" /><div v-else class="admin-list"><UiCard v-for="item in assets" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title || "Без названия" }}</h3><div class="admin-meta"><span class="mc-chip">{{ item.type }}</span><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ item.variantCount }} вариантов</span></div></div><p class="mc-text-sm">{{ item.language || "Язык не указан" }}</p><UiButton size="sm" variant="outline" @click="attachAsset(item)">Привязать</UiButton></UiCard></div></section>

      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Worker queue</p><h2>Задачи обработки</h2></div><span class="text-caption">{{ jobs.length }}</span></div><UiEmptyState v-if="!jobs.length" title="Очередь пуста" /><div v-else class="admin-list"><UiCard v-for="item in jobs" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title || item.profileCode }}</h3><p class="mc-text-sm">{{ item.profileCode }} · попыток {{ item.attemptCount }}</p></div><span class="mc-chip">{{ item.status }}</span><div class="admin-actions"><UiButton v-if="item.status === 'QUEUED'" size="sm" variant="outline" @click="updateJob(item, 'RUNNING')">Запустить</UiButton><UiButton v-if="item.status === 'RUNNING'" size="sm" variant="ghost" @click="updateJob(item, 'FAILED')">Ошибка</UiButton><UiButton v-if="item.status === 'RUNNING'" size="sm" variant="primary" @click="completeJob(item)">Готово</UiButton></div></UiCard></div></section>
    </template>

    <UiDialog v-model="uploadOpen" title="Новая сессия загрузки"><UiForm :loading="saving" :error="error" @submit="saveUpload"><UiInput v-model="uploadForm.expectedSizeByte" label="Ожидаемый размер, байт" type="number" /><UiInput v-model="uploadForm.expectedSha256Hex" label="SHA-256" placeholder="64 шестнадцатеричных символа" /><template #actions><UiButton variant="ghost" @click="uploadOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Создать</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="completeOpen" title="Подтвердить загруженный файл" size="lg"><UiForm :loading="saving" :error="error" @submit="saveComplete"><div class="mc-form-grid"><UiSelect v-model="completeForm.providerCode" label="Провайдер" :options="options(refs.providers)" /><UiInput v-model="completeForm.bucketName" label="Bucket" required /><UiInput v-model="completeForm.objectKey" label="Object key" required /><UiInput v-model="completeForm.sizeByte" label="Размер, байт" type="number" required /><UiInput v-model="completeForm.contentType" label="Content-Type" /></div><UiInput v-model="completeForm.sha256Hex" label="Проверенный SHA-256" required /><template #actions><UiButton variant="ghost" @click="completeOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Подтвердить</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="sourceOpen" title="Создать asset из объекта" size="lg"><UiForm :loading="saving" :error="error" @submit="saveSource"><div class="mc-form-grid"><UiInput v-model="sourceForm.title" label="Название" /><UiSelect v-model="sourceForm.typeCode" label="Тип" :options="options(refs.assetTypes)" /><UiSelect v-model="sourceForm.languageCode" label="Язык" :options="[{label: 'Не указан', value: ''}, ...options(refs.languages)]" /><UiInput v-model="sourceForm.durationMs" label="Длительность, мс" type="number" /><UiInput v-model="sourceForm.variantCode" label="Код варианта" /><UiInput v-model="sourceForm.container" label="Контейнер" /><UiInput v-model="sourceForm.codec" label="Кодек" /></div><template #actions><UiButton variant="ghost" @click="sourceOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Создать</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="attachOpen" title="Привязать asset к контенту"><UiForm :loading="saving" :error="error" @submit="saveAttach"><UiSelect v-model="attachForm.contentId" label="Контент" :options="contentOptions" /><UiSelect v-model="attachForm.roleCode" label="Роль" :options="options(refs.roles)" /><UiSelect v-model="attachForm.territoryCode" label="Территория" :options="[{label: 'Без ограничения', value: ''}, ...options(refs.territories)]" /><UiInput v-model="attachForm.ordinal" label="Порядок" type="number" /><UiCheckbox v-model="attachForm.isPrimary" label="Основной asset" /><template #actions><UiButton variant="ghost" @click="attachOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Привязать</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="jobOpen" title="Новая задача обработки"><UiForm :loading="saving" :error="error" @submit="saveJob"><UiSelect v-model="jobForm.sourceAssetVariantId" label="Исходный вариант" :options="sourceVariantOptions" /><UiInput v-model="jobForm.profileCode" label="Профиль" placeholder="VIDEO_HLS_1080P" required /><template #actions><UiButton variant="ghost" @click="jobOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">В очередь</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="jobCompleteOpen" title="Результат обработки" size="lg"><UiForm :loading="saving" :error="error" @submit="saveJobComplete"><div class="mc-form-grid"><UiSelect v-model="jobCompleteForm.providerCode" label="Провайдер" :options="options(refs.providers)" /><UiInput v-model="jobCompleteForm.bucketName" label="Bucket" required /><UiInput v-model="jobCompleteForm.objectKey" label="Object key" required /><UiInput v-model="jobCompleteForm.sizeByte" label="Размер, байт" type="number" required /><UiInput v-model="jobCompleteForm.contentType" label="Content-Type" /><UiInput v-model="jobCompleteForm.variantCode" label="Код варианта" required /><UiInput v-model="jobCompleteForm.container" label="Контейнер" /><UiInput v-model="jobCompleteForm.codec" label="Кодек" /></div><UiInput v-model="jobCompleteForm.sha256Hex" label="SHA-256 результата" required /><template #actions><UiButton variant="ghost" @click="jobCompleteOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Завершить задачу</UiButton></template></UiForm></UiDialog>
  </div>
</template>
