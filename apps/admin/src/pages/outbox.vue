<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Системные события"});
type RefItem = {code: string; name: string};
type Event = {id: string; ownerService: string; eventType: string; eventVersion: number; payload: Record<string, unknown>; occurDtm: string; publishDtm: string | null; attemptCount: number; lastError: string | null};
const client = useAdminClient(); const events = ref<Event[]>([]); const services = ref<RefItem[]>([]);
const filters = reactive({q: "", state: "all", service: ""}); const loading = ref(true); const saving = ref(false); const error = ref("");
const eventOpen = ref(false); const failOpen = ref(false); const selected = ref<Event | null>(null);
const eventForm = reactive({ownerServiceCode: "", eventType: "", aggregatePublicId: "", payload: "{}"}); const failForm = reactive({error: ""});
const stateOptions = [{label: "Все", value: "all"}, {label: "Ожидают", value: "pending"}, {label: "Опубликованы", value: "published"}, {label: "С ошибкой", value: "failed"}];
async function load() { loading.value = true; error.value = ""; try { const params = new URLSearchParams({state: filters.state}); if (filters.q) params.set("q", filters.q); if (filters.service) params.set("service", filters.service); const [eventResponse, referenceResponse] = await Promise.all([client.request<{items: Event[]}>(`/api/v1/admin/outbox/events?${params}`), client.request<{services: RefItem[]}>("/api/v1/admin/audit/references")]); events.value = eventResponse.items; services.value = referenceResponse.services; } catch (caught: any) { error.value = caught.message || "Не удалось загрузить outbox"; } finally { loading.value = false; } }
async function mutate(action: () => Promise<unknown>, close?: () => void) { saving.value = true; error.value = ""; try { await action(); close?.(); await load(); } catch (caught: any) { error.value = caught.message || "Операция не выполнена"; } finally { saving.value = false; } }
function newEvent() { Object.assign(eventForm, {ownerServiceCode: services.value[0]?.code || "", eventType: "", aggregatePublicId: "", payload: "{}"}); eventOpen.value = true; }
function saveEvent() { let payload = {}; try { payload = JSON.parse(eventForm.payload || "{}"); } catch { error.value = "Payload должен быть корректным JSON"; return; } return mutate(() => client.request("/api/v1/admin/outbox/events", {method: "POST", body: JSON.stringify({ownerServiceCode: eventForm.ownerServiceCode, eventType: eventForm.eventType, aggregatePublicId: eventForm.aggregatePublicId || undefined, payload})}), () => eventOpen.value = false); }
const publish = (item: Event) => mutate(() => client.request(`/api/v1/admin/outbox/events/${item.id}/publish`, {method: "PATCH"}));
const retry = (item: Event) => mutate(() => client.request(`/api/v1/admin/outbox/events/${item.id}/retry`, {method: "PATCH"}));
function fail(item: Event) { selected.value = item; failForm.error = item.lastError || ""; failOpen.value = true; }
function saveFailure() { if (!selected.value) return; return mutate(() => client.request(`/api/v1/admin/outbox/events/${selected.value!.id}/fail`, {method: "PATCH", body: JSON.stringify(failForm)}), () => failOpen.value = false); }
const state = (item: Event) => item.publishDtm ? "Опубликовано" : item.lastError ? "Ошибка" : "Ожидает";
onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Transactional outbox</p><h1 class="text-title">Системные события</h1><p class="text-subtitle">Диагностика событий между доменами. Ручные действия предназначены для разработки и аварийного восстановления.</p></div><UiButton variant="primary" @click="newEvent">Добавить событие</UiButton></header>
    <UiCard title="Фильтры"><div class="admin-toolbar"><UiInput v-model="filters.q" label="Поиск" placeholder="Тип или aggregate ID" @keyup.enter="load" /><UiSelect v-model="filters.state" label="Состояние" :options="stateOptions" /><UiSelect v-model="filters.service" label="Сервис" :options="[{label: 'Все', value: ''}, ...services.map((item) => ({label: item.name, value: item.code}))]" /><UiButton variant="primary" :loading="loading" @click="load">Применить</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p><UiCard v-if="loading" title="Чтение очереди…" /><UiEmptyState v-else-if="!events.length" title="События не найдены" />
    <div v-else class="admin-list"><UiCard v-for="item in events" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.eventType }}</h3><p class="mc-text-sm">{{ item.ownerService }} · v{{ item.eventVersion }}</p><div class="admin-meta"><span class="mc-chip">{{ state(item) }}</span><span class="mc-chip">{{ item.attemptCount }} попыток</span></div><p v-if="item.lastError" class="admin-error">{{ item.lastError }}</p></div><p class="mc-text-sm">{{ new Date(item.occurDtm).toLocaleString('ru-RU') }}</p><div class="admin-actions"><UiButton v-if="!item.publishDtm" size="sm" variant="primary" :loading="saving" @click="publish(item)">Опубликовано</UiButton><UiButton v-if="!item.publishDtm" size="sm" variant="outline" @click="fail(item)">Ошибка</UiButton><UiButton v-if="item.publishDtm || item.lastError" size="sm" variant="ghost" @click="retry(item)">Повторить</UiButton></div></UiCard></div>
    <UiDialog v-model="eventOpen" title="Ручное событие"><UiForm :loading="saving" :error="error" @submit="saveEvent"><UiSelect v-model="eventForm.ownerServiceCode" label="Сервис-владелец" :options="services.map((item) => ({label: item.name, value: item.code}))" /><UiInput v-model="eventForm.eventType" label="Тип события" placeholder="content.publication.changed" required /><UiInput v-model="eventForm.aggregatePublicId" label="Aggregate UUID" /><UiTextarea v-model="eventForm.payload" label="Payload JSON" rows="8" /><template #actions><UiButton variant="ghost" @click="eventOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Добавить</UiButton></template></UiForm></UiDialog>
    <UiDialog v-model="failOpen" title="Зафиксировать ошибку доставки"><UiForm :loading="saving" :error="error" @submit="saveFailure"><UiTextarea v-model="failForm.error" label="Ошибка" rows="6" required /><template #actions><UiButton variant="ghost" @click="failOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Записать</UiButton></template></UiForm></UiDialog>
  </div>
</template>
