<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Карточка пользователя"});

interface Role {id: string; code: string; name: string; scope: string; assignDtm: string}
interface Session {id: string; status: string; deviceName: string | null; platformCode: string | null; riskLevel: number; lastSeenDtm: string; absoluteExpireDtm: string; revokeDtm: string | null}
interface Account {id: string; username: string; displayName: string; bio: string | null; isDiscoverable: boolean; email: string | null; emailVerified: boolean; status: string; statusName: string; registerDtm: string; statusChangeDtm: string; roles: Role[]; sessions: Session[]; statusHistory: {code: string; name: string; reasonCode: string | null; changeDtm: string; changedBy: string | null}[]}

const route = useRoute();
const client = useAdminClient();
const account = ref<Account | null>(null);
const allRoles = ref<{code: string; name: string}[]>([]);
const statuses = ref<{code: string; name: string}[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");
const profile = reactive({displayName: "", username: "", bio: "", isDiscoverable: true});
const statusForm = reactive({status: "", reasonCode: "ADMIN_CHANGE"});
const roleCode = ref("");

const availableRoles = computed(() => allRoles.value.filter((role) => !account.value?.roles.some((assigned) => assigned.code === role.code)).map((role) => ({label: role.name, value: role.code})));
const statusOptions = computed(() => statuses.value.map((item) => ({label: item.name, value: item.code})));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const id = String(route.params.id);
    const [detail, roles, statusList] = await Promise.all([
      client.request<Account>(`/api/v1/admin/accounts/${id}`),
      client.request<{items: {code: string; name: string}[]}>("/api/v1/admin/roles"),
      client.request<{items: {code: string; name: string}[]}>("/api/v1/admin/account-statuses"),
    ]);
    account.value = detail;
    allRoles.value = roles.items;
    statuses.value = statusList.items;
    Object.assign(profile, {displayName: detail.displayName, username: detail.username, bio: detail.bio || "", isDiscoverable: detail.isDiscoverable});
    statusForm.status = detail.status;
    roleCode.value = availableRoles.value[0]?.value || "";
  } catch (caught: any) {
    error.value = caught.message || "Не удалось загрузить аккаунт";
  } finally {
    loading.value = false;
  }
}

async function mutate(action: () => Promise<unknown>, message: string) {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    await action();
    success.value = message;
    await load();
  } catch (caught: any) {
    error.value = caught.message || "Операция не выполнена";
  } finally {
    saving.value = false;
  }
}

const saveProfile = () => mutate(() => client.request(`/api/v1/admin/accounts/${route.params.id}/profile`, {method: "PATCH", body: JSON.stringify({...profile, bio: profile.bio || null})}), "Профиль обновлён");
const saveStatus = () => mutate(() => client.request(`/api/v1/admin/accounts/${route.params.id}/status`, {method: "PATCH", body: JSON.stringify(statusForm)}), "Статус обновлён");
const assignRole = () => roleCode.value && mutate(() => client.request(`/api/v1/admin/accounts/${route.params.id}/roles`, {method: "POST", body: JSON.stringify({roles: [roleCode.value]})}), "Роль назначена");
const revokeRole = (code: string) => mutate(() => client.request(`/api/v1/admin/accounts/${route.params.id}/roles/${code}`, {method: "DELETE"}), "Роль отозвана");
const revokeSession = (id: string) => mutate(() => client.request(`/api/v1/admin/accounts/${route.params.id}/sessions/${id}`, {method: "DELETE"}), "Сессия завершена");

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div><p class="admin-eyebrow">Account · {{ route.params.id }}</p><h1 class="text-title">{{ account?.displayName || "Пользователь" }}</h1><p class="text-subtitle">Профиль, статус, роли и сессии одного аккаунта.</p></div>
      <UiButton variant="outline" to="/users">К списку</UiButton>
    </header>

    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <p v-if="success" class="mc-accent" role="status">{{ success }}</p>
    <UiCard v-if="loading" title="Загрузка аккаунта…" />

    <template v-else-if="account">
      <section class="admin-detail-grid">
        <UiCard title="Профиль" :description="account.email || 'Email не указан'">
          <UiForm :loading="saving" @submit="saveProfile">
            <div class="mc-stack">
              <UiInput v-model="profile.displayName" label="Отображаемое имя" required />
              <UiInput v-model="profile.username" label="Username" required />
              <UiTextarea v-model="profile.bio" label="О пользователе" rows="4" />
              <UiCheckbox v-model="profile.isDiscoverable" label="Профиль доступен в поиске" />
            </div>
            <template #actions><UiButton type="submit" variant="primary" :loading="saving">Сохранить профиль</UiButton></template>
          </UiForm>
        </UiCard>

        <UiCard title="Статус аккаунта" :description="`Изменён ${new Date(account.statusChangeDtm).toLocaleString('ru-RU')}`">
          <UiForm :loading="saving" @submit="saveStatus">
            <div class="mc-stack">
              <UiSelect v-model="statusForm.status" label="Статус" :options="statusOptions" />
              <UiInput v-model="statusForm.reasonCode" label="Код причины" />
              <p class="mc-text-sm">Блокирующий статус немедленно отзывает все сессии и refresh-токены.</p>
            </div>
            <template #actions><UiButton type="submit" variant="primary" :loading="saving">Изменить статус</UiButton></template>
          </UiForm>
        </UiCard>
      </section>

      <section class="admin-detail-grid">
        <UiCard title="Роли" description="Назначения действуют в глобальном scope.">
          <div class="admin-toolbar">
            <UiSelect v-model="roleCode" label="Добавить роль" :options="availableRoles" placeholder="Нет доступных ролей" />
            <UiButton variant="outline" :disabled="!roleCode" :loading="saving" @click="assignRole">Назначить</UiButton>
          </div>
          <div class="mc-stack">
            <div v-for="role in account.roles" :key="role.id" class="admin-data-row">
              <div><strong>{{ role.name }}</strong><p class="mc-text-sm">{{ role.code }} · {{ role.scope }}</p></div>
              <UiButton variant="ghost" size="sm" :disabled="saving" @click="revokeRole(role.code)">Отозвать</UiButton>
            </div>
          </div>
        </UiCard>

        <UiCard title="История статусов" description="Последние 50 изменений.">
          <div class="mc-stack">
            <div v-for="item in account.statusHistory" :key="item.changeDtm" class="admin-data-row">
              <div><strong>{{ item.name }}</strong><p class="mc-text-sm">{{ item.reasonCode || "Без причины" }} · {{ item.changedBy || "Система" }}</p></div>
              <time class="mc-caption">{{ new Date(item.changeDtm).toLocaleDateString("ru-RU") }}</time>
            </div>
            <p v-if="!account.statusHistory.length" class="mc-text-sm">История пока пуста.</p>
          </div>
        </UiCard>
      </section>

      <UiCard title="Сессии" description="Активные и завершённые входы пользователя.">
        <div class="mc-stack">
          <div v-for="session in account.sessions" :key="session.id" class="admin-data-row">
            <div>
              <strong>{{ session.deviceName || session.platformCode || "Неизвестное устройство" }}</strong>
              <p class="mc-text-sm">{{ session.status }} · риск {{ session.riskLevel }} · активность {{ new Date(session.lastSeenDtm).toLocaleString("ru-RU") }}</p>
            </div>
            <UiButton v-if="!session.revokeDtm" variant="danger" size="sm" :disabled="saving" @click="revokeSession(session.id)">Завершить</UiButton>
          </div>
          <p v-if="!account.sessions.length" class="mc-text-sm">Сессий нет.</p>
        </div>
      </UiCard>
    </template>
  </div>
</template>
