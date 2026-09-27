<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Аудит"});
type RefItem = {code: string; name: string};
type Event = {id: string; category: string; service: string; actionCode: string; outcomeCode: string; details: Record<string, unknown>; correlationId: string; actorName: string | null; actorUsername: string | null; targetResourceId: string | null; targetResourceType: string | null; occurDtm: string};
const client = useAdminClient(); const events = ref<Event[]>([]); const refs = ref<{categories: RefItem[]; services: RefItem[]; outcomes: string[]}>({categories: [], services: [], outcomes: []});
const filters = reactive({q: "", category: "", service: "", outcome: ""}); const loading = ref(true); const error = ref(""); const selected = ref<Event | null>(null); const detailOpen = ref(false);
const options = (items: RefItem[]) => items.map((item) => ({label: item.name, value: item.code}));
async function load() { loading.value = true; error.value = ""; try { const params = new URLSearchParams({limit: "200"}); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value)); const [eventResponse, referenceResponse] = await Promise.all([client.request<{items: Event[]}>(`/api/v1/admin/audit/events?${params}`), client.request<typeof refs.value>("/api/v1/admin/audit/references")]); events.value = eventResponse.items; refs.value = referenceResponse; } catch (caught: any) { error.value = caught.message || "Не удалось загрузить аудит"; } finally { loading.value = false; } }
function inspect(item: Event) { selected.value = item; detailOpen.value = true; }
onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Immutable audit log</p><h1 class="text-title">Аудит действий</h1><p class="text-subtitle">Неизменяемая история чувствительных операций, решений и системных исходов.</p></div></header>
    <UiCard title="Фильтры"><div class="admin-toolbar"><UiInput v-model="filters.q" label="Поиск" placeholder="Действие, актор или ресурс" @keyup.enter="load" /><UiSelect v-model="filters.category" label="Категория" :options="[{label: 'Все', value: ''}, ...options(refs.categories)]" /><UiSelect v-model="filters.service" label="Сервис" :options="[{label: 'Все', value: ''}, ...options(refs.services)]" /><UiSelect v-model="filters.outcome" label="Исход" :options="[{label: 'Все', value: ''}, ...refs.outcomes.map((value) => ({label: value, value}))]" /><UiButton variant="primary" :loading="loading" @click="load">Применить</UiButton></div></UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p><UiCard v-if="loading" title="Чтение журнала…" /><UiEmptyState v-else-if="!events.length" title="События не найдены" />
    <div v-else class="admin-list"><UiCard v-for="item in events" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.actionCode }}</h3><p class="mc-text-sm">{{ item.actorName || 'Система' }}<template v-if="item.actorUsername"> · @{{ item.actorUsername }}</template></p><div class="admin-meta"><span class="mc-chip">{{ item.category }}</span><span class="mc-chip">{{ item.service }}</span><span class="mc-chip">{{ item.outcomeCode }}</span></div></div><p class="mc-text-sm">{{ new Date(item.occurDtm).toLocaleString('ru-RU') }}</p><UiButton size="sm" variant="outline" @click="inspect(item)">Подробнее</UiButton></UiCard></div>
    <UiDialog v-model="detailOpen" :title="selected?.actionCode || 'Событие аудита'" size="lg"><div v-if="selected" class="mc-stack"><div class="admin-meta"><span class="mc-chip">{{ selected.category }}</span><span class="mc-chip">{{ selected.service }}</span><span class="mc-chip">{{ selected.outcomeCode }}</span></div><UiCard title="Контекст"><p class="mc-text-sm">Актор: {{ selected.actorName || 'Система' }}</p><p class="mc-text-sm">Ресурс: {{ selected.targetResourceType || 'не указан' }} · {{ selected.targetResourceId || '—' }}</p><p class="mc-text-sm">Correlation ID: {{ selected.correlationId || '—' }}</p></UiCard><UiTextarea :model-value="JSON.stringify(selected.details, null, 2)" label="Details" rows="10" readonly /></div></UiDialog>
  </div>
</template>
