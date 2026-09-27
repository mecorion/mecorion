<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";

definePageMeta({title: "Библиотека"});
type Collection = {id: string; name: string; description: string | null; visibility: string; type: string; ownerUsername: string; ownerName: string; itemCount: number; createDtm: string};
type Grant = {id: string; displayName: string; username: string; title: string; deviceName: string; status: string; statusName: string; grantDtm: string; expireDtm: string; revokeDtm: string | null};
type Progress = {displayName: string; username: string; title: string; positionMs: string; durationMs: string | null; isCompleted: boolean; firstPlayDtm: string; lastPlayDtm: string};
const client = useAdminClient();
const collections = ref<Collection[]>([]); const grants = ref<Grant[]>([]); const progress = ref<Progress[]>([]);
const loading = ref(true); const saving = ref(false); const error = ref("");
const date = (value: string) => new Date(value).toLocaleString("ru-RU");
const duration = (value: string | null) => value ? `${Math.floor(Number(value) / 60000)} мин` : "Не указано";
async function load() { loading.value = true; error.value = ""; try { const [collectionResponse, grantResponse, progressResponse] = await Promise.all([client.request<{items: Collection[]}>("/api/v1/admin/library/collections"), client.request<{items: Grant[]}>("/api/v1/admin/library/offline-grants"), client.request<{items: Progress[]}>("/api/v1/admin/library/playback-progress")]); collections.value = collectionResponse.items; grants.value = grantResponse.items; progress.value = progressResponse.items; } catch (caught: any) { error.value = caught.message || "Не удалось загрузить библиотеку"; } finally { loading.value = false; } }
async function mutate(action: () => Promise<unknown>) { saving.value = true; error.value = ""; try { await action(); await load(); } catch (caught: any) { error.value = caught.message || "Операция не выполнена"; } finally { saving.value = false; } }
const deleteCollection = (item: Collection) => mutate(() => client.request(`/api/v1/admin/library/collections/${item.id}`, {method: "DELETE"}));
const revokeGrant = (item: Grant) => mutate(() => client.request(`/api/v1/admin/library/offline-grants/${item.id}/revoke`, {method: "PATCH"}));
onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading"><div><p class="admin-eyebrow">Library operations</p><h1 class="text-title">Пользовательская библиотека</h1><p class="text-subtitle">Коллекции, offline-доступ и прогресс воспроизведения во всех сервисах Mecorion.</p></div><UiButton variant="outline" :loading="loading" @click="load">Обновить</UiButton></header>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p><UiCard v-if="loading" title="Загрузка библиотек…" />
    <template v-else>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Collections</p><h2>Коллекции</h2></div><span class="text-caption">{{ collections.length }}</span></div><UiEmptyState v-if="!collections.length" title="Коллекций пока нет" /><div v-else class="admin-list"><UiCard v-for="item in collections" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.name }}</h3><p class="mc-text-sm">{{ item.ownerName }} · @{{ item.ownerUsername }}</p><div class="admin-meta"><span class="mc-chip">{{ item.type }}</span><span class="mc-chip">{{ item.visibility }}</span><span class="mc-chip">{{ item.itemCount }} элементов</span></div></div><p class="mc-text-sm">{{ date(item.createDtm) }}</p><UiButton size="sm" variant="ghost" :loading="saving" @click="deleteCollection(item)">Удалить</UiButton></UiCard></div></section>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Offline access</p><h2>Offline-разрешения</h2></div><span class="text-caption">{{ grants.length }}</span></div><UiEmptyState v-if="!grants.length" title="Offline-разрешений нет" /><div v-else class="admin-list"><UiCard v-for="item in grants" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">{{ item.displayName }} · {{ item.deviceName }}</p><div class="admin-meta"><span class="mc-chip">{{ item.statusName }}</span><span class="mc-chip">до {{ date(item.expireDtm) }}</span></div></div><p class="mc-text-sm">Выдано {{ date(item.grantDtm) }}</p><UiButton v-if="!item.revokeDtm" size="sm" variant="ghost" :loading="saving" @click="revokeGrant(item)">Отозвать</UiButton></UiCard></div></section>
      <section class="mc-section"><div class="admin-section-heading"><div><p class="text-caption">Playback</p><h2>Последняя активность</h2></div><span class="text-caption">{{ progress.length }}</span></div><UiEmptyState v-if="!progress.length" title="Прогресс ещё не записан" /><div v-else class="admin-list"><UiCard v-for="(item, index) in progress" :key="`${item.username}-${item.title}-${index}`" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">{{ item.displayName }} · @{{ item.username }}</p><div class="admin-meta"><span class="mc-chip">{{ duration(item.positionMs) }} / {{ duration(item.durationMs) }}</span><span v-if="item.isCompleted" class="mc-chip">Завершено</span></div></div><p class="mc-text-sm">{{ date(item.lastPlayDtm) }}</p></UiCard></div></section>
    </template>
  </div>
</template>
