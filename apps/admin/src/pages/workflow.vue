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

definePageMeta({title: "Заявки"});

type RefItem = {code: string; name: string; isFinal?: boolean};
type RequestItem = {id: string; type: string; typeName: string; status: string; statusName: string; title: string; payload: Record<string, unknown>; createdBy: string | null; createDtm: string; submitDtm: string | null; completeDtm: string | null; reviewCount: number; targetCount: number};
type Revision = {revisionNumber: number; payload: Record<string, unknown>; createdBy: string | null; createDtm: string};
type Review = {id: string; type: string; decision: string; score: string | null; comment: string | null; reviewedBy: string | null; reviewerRoleCode: string | null; createDtm: string};
type History = {status: string; statusName: string; changeSource: string; reason: string | null; changedBy: string | null; changeDtm: string};
type Target = {id: string; type: string; role: string};
type Detail = {item: RequestItem; revisions: Revision[]; reviews: Review[]; history: History[]; targets: Target[]};

const client = useAdminClient();
const requests = ref<RequestItem[]>([]);
const references = ref<{types: RefItem[]; statuses: RefItem[]; reviewTypes: RefItem[]}>({types: [], statuses: [], reviewTypes: []});
const detail = ref<Detail | null>(null);
const query = ref("");
const status = ref("");
const type = ref("");
const loading = ref(true);
const detailLoading = ref(false);
const saving = ref(false);
const error = ref("");
const detailOpen = ref(false);
const reviewOpen = ref(false);
const reviewForm = reactive({reviewTypeCode: "MODERATOR", reviewerRoleCode: "ADMIN", decisionCode: "APPROVE", score: "", comment: "", evidence: "{}", applyDecision: true});

const options = (items: RefItem[]) => items.map((item) => ({label: item.name, value: item.code}));
const statusOptions = computed(() => [{label: "Все статусы", value: ""}, ...options(references.value.statuses)]);
const typeOptions = computed(() => [{label: "Все типы", value: ""}, ...options(references.value.types)]);
const reviewTypeOptions = computed(() => options(references.value.reviewTypes));
const decisionOptions = [
  {label: "Одобрить", value: "APPROVE"}, {label: "Отклонить", value: "REJECT"},
  {label: "Запросить изменения", value: "NEEDS_CHANGES"}, {label: "Воздержаться", value: "ABSTAIN"},
  {label: "Возможный дубликат", value: "POSSIBLE_DUPLICATE"},
];
const payloadText = computed(() => JSON.stringify(detail.value?.item.payload || {}, null, 2));
const date = (value: string | null) => value ? new Date(value).toLocaleString("ru-RU") : "Не указано";

async function load() {
  loading.value = true; error.value = "";
  try {
    const params = new URLSearchParams({limit: "100"});
    if (query.value) params.set("q", query.value);
    if (status.value) params.set("status", status.value);
    if (type.value) params.set("type", type.value);
    const [requestResponse, referenceResponse] = await Promise.all([
      client.request<{items: RequestItem[]}>(`/api/v1/admin/workflow/requests?${params}`),
      client.request<typeof references.value>("/api/v1/admin/workflow/references"),
    ]);
    requests.value = requestResponse.items; references.value = referenceResponse;
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить заявки"; }
  finally { loading.value = false; }
}

async function openDetail(item: RequestItem) {
  detailOpen.value = true; detailLoading.value = true; error.value = "";
  try { detail.value = await client.request<Detail>(`/api/v1/admin/workflow/requests/${item.id}`); }
  catch (caught: any) { error.value = caught.message || "Не удалось открыть заявку"; detailOpen.value = false; }
  finally { detailLoading.value = false; }
}

async function refreshDetail() {
  if (!detail.value) return;
  detail.value = await client.request<Detail>(`/api/v1/admin/workflow/requests/${detail.value.item.id}`);
}

async function mutate(action: () => Promise<unknown>, close?: () => void) {
  saving.value = true; error.value = "";
  try { await action(); close?.(); await Promise.all([load(), refreshDetail()]); }
  catch (caught: any) { error.value = caught.message || "Операция не выполнена"; }
  finally { saving.value = false; }
}

function startReview() {
  Object.assign(reviewForm, {reviewTypeCode: references.value.reviewTypes.find((item) => item.code === "MODERATOR")?.code || references.value.reviewTypes[0]?.code || "", reviewerRoleCode: "ADMIN", decisionCode: "APPROVE", score: "", comment: "", evidence: "{}", applyDecision: true});
  reviewOpen.value = true;
}

function changeStatus(statusCode: string, reason: string) {
  if (!detail.value) return;
  return mutate(() => client.request(`/api/v1/admin/workflow/requests/${detail.value!.item.id}/status`, {method: "PATCH", body: JSON.stringify({statusCode, reason})}));
}

function saveReview() {
  if (!detail.value) return;
  let evidence: Record<string, unknown>;
  try { evidence = JSON.parse(reviewForm.evidence || "{}"); }
  catch { error.value = "Evidence должна быть корректным JSON-объектом"; return; }
  const body = {...reviewForm, score: reviewForm.score ? Number(reviewForm.score) : undefined, comment: reviewForm.comment || undefined, evidence};
  return mutate(() => client.request(`/api/v1/admin/workflow/requests/${detail.value!.item.id}/reviews`, {method: "POST", body: JSON.stringify(body)}), () => reviewOpen.value = false);
}

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Editorial workflow</p><h1 class="text-title">Заявки</h1><p class="text-subtitle">Редакционная очередь предложений, проверок и решений по контенту платформы.</p></div><UiButton variant="outline" :loading="loading" @click="load">Обновить</UiButton></header>
    <UiCard title="Фильтры"><div class="admin-toolbar"><UiInput v-model="query" label="Поиск" placeholder="Название или автор" @keyup.enter="load" /><UiSelect v-model="status" label="Статус" :options="statusOptions" /><UiSelect v-model="type" label="Тип заявки" :options="typeOptions" /><UiButton variant="primary" :loading="loading" @click="load">Применить</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка очереди…" />
    <UiEmptyState v-else-if="!requests.length" title="Заявки не найдены" description="Измените фильтры или дождитесь новых предложений." />
    <section v-else class="admin-list">
      <UiCard v-for="item in requests" :key="item.id" class="admin-list-item" raw>
        <div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">{{ item.createdBy || "Системная заявка" }} · {{ item.typeName }}</p><div class="admin-meta"><span class="mc-chip">{{ item.statusName }}</span><span class="mc-chip">{{ item.reviewCount }} reviews</span><span v-if="item.targetCount" class="mc-chip">{{ item.targetCount }} ресурсов</span></div></div>
        <p class="mc-text-sm">{{ item.submitDtm ? `Отправлена ${date(item.submitDtm)}` : `Создана ${date(item.createDtm)}` }}</p>
        <UiButton variant="outline" size="sm" @click="openDetail(item)">Открыть</UiButton>
      </UiCard>
    </section>

    <UiDialog v-model="detailOpen" :title="detail?.item.title || 'Заявка'" size="xl" sticky-footer>
      <UiCard v-if="detailLoading" title="Загрузка заявки…" />
      <div v-else-if="detail" class="mc-stack">
        <div class="admin-meta"><span class="mc-chip">{{ detail.item.typeName }}</span><span class="mc-chip">{{ detail.item.statusName }}</span><span class="mc-chip">{{ detail.item.createdBy || "Система" }}</span></div>
        <div class="admin-actions"><UiButton v-if="detail.item.status === 'SUBMITTED'" size="sm" variant="outline" @click="changeStatus('AUTO_CHECK', 'Начата автоматическая проверка')">Автопроверка</UiButton><UiButton v-if="['SUBMITTED', 'AUTO_CHECK'].includes(detail.item.status)" size="sm" variant="outline" @click="changeStatus('COMMUNITY_REVIEW', 'Передано на расширенную проверку')">На проверку</UiButton><UiButton v-if="['SUBMITTED', 'AUTO_CHECK', 'COMMUNITY_REVIEW'].includes(detail.item.status)" size="sm" variant="primary" @click="startReview">Добавить review</UiButton></div>
        <div class="admin-detail-grid">
          <UiCard title="Payload"><UiTextarea :model-value="payloadText" rows="14" readonly /></UiCard>
          <UiCard title="Сведения"><div class="admin-data-row"><span>Создана</span><strong>{{ date(detail.item.createDtm) }}</strong></div><div class="admin-data-row"><span>Отправлена</span><strong>{{ date(detail.item.submitDtm) }}</strong></div><div class="admin-data-row"><span>Завершена</span><strong>{{ date(detail.item.completeDtm) }}</strong></div><div class="admin-data-row"><span>Целей</span><strong>{{ detail.targets.length }}</strong></div></UiCard>
        </div>
        <UiCard title="Reviews"><UiEmptyState v-if="!detail.reviews.length" title="Решений пока нет" /><div v-else class="admin-list"><div v-for="item in detail.reviews" :key="item.id" class="admin-data-row"><div><strong>{{ item.decision }}</strong><p class="mc-text-sm">{{ item.comment || "Без комментария" }}</p><span class="text-caption">{{ item.type }} · {{ item.reviewedBy || item.reviewerRoleCode }}</span></div><span class="text-caption">{{ date(item.createDtm) }}</span></div></div></UiCard>
        <div class="admin-detail-grid"><UiCard title="История статусов"><UiEmptyState v-if="!detail.history.length" title="История пуста" /><div v-else><div v-for="item in detail.history" :key="`${item.status}-${item.changeDtm}`" class="admin-data-row"><div><strong>{{ item.statusName }}</strong><p class="mc-text-sm">{{ item.reason || item.changeSource }}</p></div><span class="text-caption">{{ date(item.changeDtm) }}</span></div></div></UiCard><UiCard title="Revisions"><div v-for="item in detail.revisions" :key="item.revisionNumber" class="admin-data-row"><div><strong>Версия {{ item.revisionNumber }}</strong><p class="mc-text-sm">{{ item.createdBy || "Система" }}</p></div><span class="text-caption">{{ date(item.createDtm) }}</span></div></UiCard></div>
      </div>
      <template #footer><UiButton variant="ghost" @click="detailOpen = false">Закрыть</UiButton></template>
    </UiDialog>

    <UiDialog v-model="reviewOpen" title="Новое решение" description="Review сохраняется отдельно; подтверждённое решение также меняет статус заявки." size="lg"><UiForm :loading="saving" :error="error" @submit="saveReview"><div class="mc-form-grid"><UiSelect v-model="reviewForm.reviewTypeCode" label="Тип проверки" :options="reviewTypeOptions" /><UiSelect v-model="reviewForm.decisionCode" label="Решение" :options="decisionOptions" /><UiInput v-model="reviewForm.reviewerRoleCode" label="Роль проверяющего" /><UiInput v-model="reviewForm.score" label="Оценка 0–1" type="number" min="0" max="1" step="0.01" /></div><UiTextarea v-model="reviewForm.comment" label="Комментарий" rows="4" /><UiTextarea v-model="reviewForm.evidence" label="Evidence JSON" rows="4" /><UiCheckbox v-model="reviewForm.applyDecision" label="Применить решение к статусу заявки" /><template #actions><UiButton variant="ghost" @click="reviewOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить review</UiButton></template></UiForm></UiDialog>
  </div>
</template>
