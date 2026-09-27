<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Модерация"});

type RefItem = {code: string; name: string};
type Report = {id: string; reason: string; reasonName: string; status: string; statusName: string; description: string | null; evidence: Record<string, unknown>; reporterAccountId: string | null; reportedBy: string | null; resourceId: string; resourceType: string; targetName: string; targetAccountId: string | null; createDtm: string; closeDtm: string | null};
type Restriction = {id: string; accountId: string; displayName: string; scope: string; permission: string | null; status: string; statusName: string; sourceType: string; sourceReportId: string | null; reasonCode: string; details: string | null; validFromDtm: string; validUntilDtm: string | null};
type Appeal = {id: string; restrictionId: string; accountId: string; displayName: string; status: string; statusName: string; statement: string; resolution: string | null; createDtm: string; resolveDtm: string | null; reasonCode: string; restrictionStatus: string};
type Account = {id: string; displayName: string; username: string};
type References = {reasons: RefItem[]; reportStatuses: RefItem[]; restrictionStatuses: RefItem[]; appealStatuses: RefItem[]; scopes: RefItem[]; permissions: RefItem[]};

const client = useAdminClient();
const reports = ref<Report[]>([]);
const restrictions = ref<Restriction[]>([]);
const appeals = ref<Appeal[]>([]);
const accounts = ref<Account[]>([]);
const refs = ref<References>({reasons: [], reportStatuses: [], restrictionStatuses: [], appealStatuses: [], scopes: [], permissions: []});
const filters = reactive({q: "", reportStatus: "", reason: "", restrictionStatus: "", appealStatus: ""});
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const selectedReport = ref<Report | null>(null);
const selectedAppeal = ref<Appeal | null>(null);
const reportOpen = ref(false);
const reportStatusOpen = ref(false);
const restrictionOpen = ref(false);
const appealOpen = ref(false);
const reportStatusForm = reactive({statusCode: "", resolutionNote: ""});
const restrictionForm = reactive({accountId: "", scopeCode: "global", permissionCode: "", statusCode: "ACTIVE", sourceType: "COMMUNITY", sourceReportId: "", reasonCode: "", details: "", validUntilDtm: ""});
const appealForm = reactive({statusCode: "UPHELD", resolution: ""});

const options = (items: RefItem[]) => items.map((item) => ({label: item.name, value: item.code}));
const reportStatusOptions = computed(() => [{label: "Все статусы", value: ""}, ...options(refs.value.reportStatuses)]);
const reasonOptions = computed(() => [{label: "Все причины", value: ""}, ...options(refs.value.reasons)]);
const restrictionStatusOptions = computed(() => [{label: "Все статусы", value: ""}, ...options(refs.value.restrictionStatuses)]);
const appealStatusOptions = computed(() => [{label: "Все статусы", value: ""}, ...options(refs.value.appealStatuses)]);
const accountOptions = computed(() => accounts.value.map((item) => ({label: `${item.displayName} · @${item.username}`, value: item.id})));
const reportOptions = computed(() => reports.value.map((item) => ({label: `${item.reasonName} · ${item.targetName}`, value: item.id})));
const sourceOptions = ["AUTOMATIC", "COMMUNITY", "COMPLAINT", "SECURITY", "LEGAL"].map((value) => ({label: value, value}));
const appealDecisionOptions = [{label: "Оставить ограничение", value: "UPHELD"}, {label: "Отменить ограничение", value: "OVERTURNED"}, {label: "Отменить апелляцию", value: "CANCELLED"}];
const date = (value: string | null) => value ? new Date(value).toLocaleString("ru-RU") : "Не указано";

async function load() {
  loading.value = true; error.value = "";
  try {
    const reportParams = new URLSearchParams({limit: "100"});
    if (filters.q) reportParams.set("q", filters.q);
    if (filters.reportStatus) reportParams.set("status", filters.reportStatus);
    if (filters.reason) reportParams.set("reason", filters.reason);
    const restrictionParams = new URLSearchParams({limit: "100"});
    if (filters.q) restrictionParams.set("q", filters.q);
    if (filters.restrictionStatus) restrictionParams.set("status", filters.restrictionStatus);
    const appealParams = new URLSearchParams({limit: "100"});
    if (filters.appealStatus) appealParams.set("status", filters.appealStatus);
    const [referenceResponse, reportResponse, restrictionResponse, appealResponse, accountResponse] = await Promise.all([
      client.request<References>("/api/v1/admin/moderation/references"),
      client.request<{items: Report[]}>(`/api/v1/admin/moderation/reports?${reportParams}`),
      client.request<{items: Restriction[]}>(`/api/v1/admin/moderation/restrictions?${restrictionParams}`),
      client.request<{items: Appeal[]}>(`/api/v1/admin/moderation/appeals?${appealParams}`),
      client.request<{items: Account[]}>("/api/v1/admin/accounts?page=1&pageSize=100"),
    ]);
    refs.value = referenceResponse; reports.value = reportResponse.items; restrictions.value = restrictionResponse.items; appeals.value = appealResponse.items; accounts.value = accountResponse.items;
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить данные модерации"; }
  finally { loading.value = false; }
}

async function mutate(action: () => Promise<unknown>, close?: () => void) {
  saving.value = true; error.value = "";
  try { await action(); close?.(); await load(); }
  catch (caught: any) { error.value = caught.message || "Операция не выполнена"; }
  finally { saving.value = false; }
}

function openReport(item: Report) { selectedReport.value = item; reportOpen.value = true; }
function openReportStatus(statusCode: string) { Object.assign(reportStatusForm, {statusCode, resolutionNote: ""}); reportStatusOpen.value = true; }
function saveReportStatus() {
  if (!selectedReport.value) return;
  return mutate(() => client.request(`/api/v1/admin/moderation/reports/${selectedReport.value!.id}/status`, {method: "PATCH", body: JSON.stringify(reportStatusForm)}), () => { reportStatusOpen.value = false; reportOpen.value = false; });
}
function newRestriction(report?: Report) {
  Object.assign(restrictionForm, {accountId: report?.targetAccountId || "", scopeCode: refs.value.scopes.find((item) => item.code === "global")?.code || refs.value.scopes[0]?.code || "", permissionCode: "", statusCode: "ACTIVE", sourceType: report ? "COMPLAINT" : "COMMUNITY", sourceReportId: report?.id || "", reasonCode: report?.reason || "", details: report?.description || "", validUntilDtm: ""});
  restrictionOpen.value = true;
}
function saveRestriction() {
  const body = {...restrictionForm, permissionCode: restrictionForm.permissionCode || undefined, sourceReportId: restrictionForm.sourceReportId || undefined, details: restrictionForm.details || undefined, validUntilDtm: restrictionForm.validUntilDtm ? new Date(restrictionForm.validUntilDtm).toISOString() : undefined};
  return mutate(() => client.request("/api/v1/admin/moderation/restrictions", {method: "POST", body: JSON.stringify(body)}), () => { restrictionOpen.value = false; reportOpen.value = false; });
}
const changeRestriction = (item: Restriction, statusCode: string) => mutate(() => client.request(`/api/v1/admin/moderation/restrictions/${item.id}/status`, {method: "PATCH", body: JSON.stringify({statusCode})}));
const startAppealReview = (item: Appeal) => mutate(() => client.request(`/api/v1/admin/moderation/appeals/${item.id}/status`, {method: "PATCH", body: JSON.stringify({statusCode: "REVIEWING", resolution: "Апелляция принята к рассмотрению"})}));
function resolveAppeal(item: Appeal) { selectedAppeal.value = item; Object.assign(appealForm, {statusCode: "UPHELD", resolution: ""}); appealOpen.value = true; }
function saveAppeal() {
  if (!selectedAppeal.value) return;
  return mutate(() => client.request(`/api/v1/admin/moderation/appeals/${selectedAppeal.value!.id}/status`, {method: "PATCH", body: JSON.stringify(appealForm)}), () => appealOpen.value = false);
}

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Trust & safety</p><h1 class="text-title">Модерация</h1><p class="text-subtitle">Жалобы пользователей, ограничения доступа и независимое рассмотрение апелляций.</p></div><UiButton variant="primary" @click="newRestriction()">Новое ограничение</UiButton></header>
    <UiCard title="Фильтры"><div class="admin-toolbar"><UiInput v-model="filters.q" label="Поиск" placeholder="Пользователь, ресурс или причина" @keyup.enter="load" /><UiSelect v-model="filters.reportStatus" label="Статус жалобы" :options="reportStatusOptions" /><UiSelect v-model="filters.reason" label="Причина" :options="reasonOptions" /><UiButton variant="primary" :loading="loading" @click="load">Применить</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка очередей…" />
    <template v-else>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Reports</p><h2>Жалобы</h2></div><span class="text-caption">{{ reports.length }}</span></div><UiEmptyState v-if="!reports.length" title="Жалобы не найдены" /><div v-else class="admin-list"><UiCard v-for="item in reports" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.targetName }}</h3><p class="mc-text-sm">{{ item.reportedBy || "Системная жалоба" }} → {{ item.resourceType }}</p><div class="admin-meta"><span class="mc-chip">{{ item.reasonName }}</span><span class="mc-chip">{{ item.statusName }}</span></div></div><p class="mc-text-sm">{{ date(item.createDtm) }}</p><UiButton size="sm" variant="outline" @click="openReport(item)">Рассмотреть</UiButton></UiCard></div></section>

      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Restrictions</p><h2>Ограничения</h2></div><UiSelect v-model="filters.restrictionStatus" label="Статус" :options="restrictionStatusOptions" @update:model-value="load" /></div><UiEmptyState v-if="!restrictions.length" title="Ограничений нет" /><div v-else class="admin-list"><UiCard v-for="item in restrictions" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.displayName }}</h3><p class="mc-text-sm">{{ item.reasonCode }} · {{ item.scope }}<template v-if="item.permission"> · {{ item.permission }}</template></p><div class="admin-meta"><span class="mc-chip">{{ item.statusName }}</span><span class="mc-chip">{{ item.sourceType }}</span></div></div><p class="mc-text-sm">До {{ date(item.validUntilDtm) }}</p><div class="admin-actions"><UiButton v-if="item.status === 'PENDING'" size="sm" variant="outline" @click="changeRestriction(item, 'ACTIVE')">Активировать</UiButton><UiButton v-if="item.status === 'ACTIVE'" size="sm" variant="outline" @click="changeRestriction(item, 'SUSPENDED')">Приостановить</UiButton><UiButton v-if="item.status === 'SUSPENDED'" size="sm" variant="outline" @click="changeRestriction(item, 'ACTIVE')">Возобновить</UiButton><UiButton v-if="['PENDING', 'ACTIVE', 'SUSPENDED'].includes(item.status)" size="sm" variant="ghost" @click="changeRestriction(item, 'REVOKED')">Отозвать</UiButton></div></UiCard></div></section>

      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Appeals</p><h2>Апелляции</h2></div><UiSelect v-model="filters.appealStatus" label="Статус" :options="appealStatusOptions" @update:model-value="load" /></div><UiEmptyState v-if="!appeals.length" title="Апелляций нет" /><div v-else class="admin-list"><UiCard v-for="item in appeals" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.displayName }}</h3><p class="mc-text-sm">{{ item.statement }}</p><div class="admin-meta"><span class="mc-chip">{{ item.statusName }}</span><span class="mc-chip">{{ item.reasonCode }}</span></div></div><p class="mc-text-sm">{{ date(item.createDtm) }}</p><div class="admin-actions"><UiButton v-if="item.status === 'SUBMITTED'" size="sm" variant="outline" @click="startAppealReview(item)">В работу</UiButton><UiButton v-if="['SUBMITTED', 'REVIEWING'].includes(item.status)" size="sm" variant="primary" @click="resolveAppeal(item)">Решение</UiButton></div></UiCard></div></section>
    </template>

    <UiDialog v-model="reportOpen" :title="selectedReport?.targetName || 'Жалоба'" size="lg"><div v-if="selectedReport" class="mc-stack"><div class="admin-meta"><span class="mc-chip">{{ selectedReport.reasonName }}</span><span class="mc-chip">{{ selectedReport.statusName }}</span></div><UiCard title="Описание"><p class="mc-text-sm">{{ selectedReport.description || "Описание отсутствует" }}</p></UiCard><UiTextarea :model-value="JSON.stringify(selectedReport.evidence, null, 2)" label="Evidence" rows="6" readonly /><div class="admin-actions"><UiButton v-if="selectedReport.targetAccountId && !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(selectedReport.status)" variant="outline" @click="newRestriction(selectedReport)">Создать ограничение</UiButton><UiButton v-if="selectedReport.status === 'OPEN'" variant="primary" @click="openReportStatus('TRIAGE')">Начать разбор</UiButton><UiButton v-if="selectedReport.status === 'TRIAGE'" variant="primary" @click="openReportStatus('INVESTIGATING')">Расследовать</UiButton><UiButton v-if="['TRIAGE', 'INVESTIGATING'].includes(selectedReport.status)" variant="primary" @click="openReportStatus('RESOLVED')">Решить</UiButton><UiButton v-if="['OPEN', 'TRIAGE', 'INVESTIGATING'].includes(selectedReport.status)" variant="ghost" @click="openReportStatus('REJECTED')">Отклонить</UiButton></div></div></UiDialog>
    <UiDialog v-model="reportStatusOpen" title="Изменить статус жалобы"><UiForm :loading="saving" :error="error" @submit="saveReportStatus"><UiTextarea v-model="reportStatusForm.resolutionNote" label="Результат проверки" rows="4" /><template #actions><UiButton variant="ghost" @click="reportStatusOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="restrictionOpen" title="Новое ограничение" size="lg"><UiForm :loading="saving" :error="error" @submit="saveRestriction"><div class="mc-form-grid"><UiSelect v-model="restrictionForm.accountId" label="Пользователь" :options="accountOptions" /><UiSelect v-model="restrictionForm.scopeCode" label="Scope" :options="options(refs.scopes)" /><UiSelect v-model="restrictionForm.permissionCode" label="Конкретное разрешение" :options="[{label: 'Весь scope', value: ''}, ...options(refs.permissions)]" scrollable /><UiSelect v-model="restrictionForm.sourceType" label="Источник" :options="sourceOptions" /><UiSelect v-if="restrictionForm.sourceType === 'COMPLAINT'" v-model="restrictionForm.sourceReportId" label="Исходная жалоба" :options="reportOptions" /><UiInput v-model="restrictionForm.reasonCode" label="Код причины" required /><UiInput v-model="restrictionForm.validUntilDtm" label="Действует до" type="datetime-local" /></div><UiTextarea v-model="restrictionForm.details" label="Подробности" rows="4" /><template #actions><UiButton variant="ghost" @click="restrictionOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Создать</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="appealOpen" title="Решение по апелляции"><UiForm :loading="saving" :error="error" @submit="saveAppeal"><UiSelect v-model="appealForm.statusCode" label="Решение" :options="appealDecisionOptions" /><UiTextarea v-model="appealForm.resolution" label="Обоснование" rows="5" required /><template #actions><UiButton variant="ghost" @click="appealOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Применить</UiButton></template></UiForm></UiDialog>
  </div>
</template>
