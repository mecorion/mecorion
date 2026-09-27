<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";

definePageMeta({title: "Пользователи"});

interface Account {id: string; username: string; displayName: string; email: string | null; status: string; roles: string[]; registerDtm: string}
interface Role {code: string; name: string}
interface ListResponse {items: Account[]; pagination: {page: number; pageSize: number; total: number; pages: number}}

const client = useAdminClient();
const accounts = ref<Account[]>([]);
const roles = ref<Role[]>([]);
const statuses = ref<{code: string; name: string}[]>([]);
const pagination = ref({page: 1, pageSize: 20, total: 0, pages: 0});
const filters = reactive({search: "", status: "", role: ""});
const loading = ref(true);
const error = ref("");
const createOpen = ref(false);
const saving = ref(false);
const createError = ref("");
const form = reactive({displayName: "", username: "", email: "", verified: true, roles: ["BASE"] as string[]});

const statusOptions = computed(() => [{label: "Все статусы", value: ""}, ...statuses.value.map((item) => ({label: item.name, value: item.code}))]);
const roleOptions = computed(() => [{label: "Все роли", value: ""}, ...roles.value.map((item) => ({label: item.name, value: item.code}))]);

async function load(page = 1) {
  loading.value = true;
  error.value = "";
  try {
    const params = new URLSearchParams({page: String(page), pageSize: String(pagination.value.pageSize)});
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.role) params.set("role", filters.role);
    const response = await client.request<ListResponse>(`/api/v1/admin/accounts?${params}`);
    accounts.value = response.items;
    pagination.value = response.pagination;
  } catch (caught: any) {
    error.value = caught.message || "Не удалось загрузить пользователей";
  } finally {
    loading.value = false;
  }
}

async function createAccount() {
  saving.value = true;
  createError.value = "";
  try {
    await client.request("/api/v1/admin/accounts", {method: "POST", body: JSON.stringify({
      displayName: form.displayName,
      username: form.username || undefined,
      email: form.email || undefined,
      verified: form.verified,
      roles: form.roles,
    })});
    createOpen.value = false;
    Object.assign(form, {displayName: "", username: "", email: "", verified: true, roles: ["BASE"]});
    await load(1);
  } catch (caught: any) {
    createError.value = caught.message || "Не удалось создать пользователя";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const [roleResponse, statusResponse] = await Promise.all([
      client.request<{items: Role[]}>("/api/v1/admin/roles"),
      client.request<{items: {code: string; name: string}[]}>("/api/v1/admin/account-statuses"),
    ]);
    roles.value = roleResponse.items;
    statuses.value = statusResponse.items;
  } catch (caught: any) {
    error.value = caught.message || "Не удалось загрузить справочники";
  }
  await load();
});
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div><p class="admin-eyebrow">Account</p><h1 class="text-title">Пользователи</h1><p class="text-subtitle">Аккаунты, статусы, роли и активные сессии платформы.</p></div>
      <UiButton variant="primary" @click="createOpen = true"><AdminIcon name="users" />Создать пользователя</UiButton>
    </header>

    <UiCard title="Поиск и фильтры" description="Фильтры применяются на стороне Mecorion API.">
      <div class="admin-toolbar">
        <UiInput v-model="filters.search" label="Поиск" placeholder="Имя, username или email" @keyup.enter="load(1)" />
        <UiSelect v-model="filters.status" label="Статус" :options="statusOptions" />
        <UiSelect v-model="filters.role" label="Роль" :options="roleOptions" />
        <UiButton variant="primary" :loading="loading" @click="load(1)">Применить</UiButton>
      </div>
    </UiCard>

    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <div v-if="loading" class="admin-list" aria-label="Загрузка"><UiCard v-for="index in 4" :key="index" title="Загрузка пользователя…" /></div>
    <UiEmptyState v-else-if="!accounts.length" title="Пользователи не найдены" description="Измените фильтры или создайте новый аккаунт." />
    <section v-else class="admin-list" aria-label="Список пользователей">
      <UiCard v-for="account in accounts" :key="account.id" class="admin-list-item" raw>
        <div class="admin-list-item__main">
          <h3>{{ account.displayName }}</h3>
          <p class="mc-text-sm">@{{ account.username }} · {{ account.email || "Email не указан" }}</p>
          <div class="admin-meta"><span class="mc-chip">{{ account.status }}</span><span v-for="role in account.roles" :key="role" class="mc-chip">{{ role }}</span></div>
        </div>
        <div><p class="mc-caption">Регистрация</p><p class="mc-text-sm">{{ new Date(account.registerDtm).toLocaleDateString("ru-RU") }}</p></div>
        <UiButton variant="outline" :to="`/users/${account.id}`">Открыть</UiButton>
      </UiCard>
    </section>

    <nav v-if="pagination.pages > 1" class="admin-pagination" aria-label="Страницы пользователей">
      <UiButton variant="outline" :disabled="pagination.page <= 1" @click="load(pagination.page - 1)">Назад</UiButton>
      <span class="mc-text-sm">Страница {{ pagination.page }} из {{ pagination.pages }} · всего {{ pagination.total }}</span>
      <UiButton variant="outline" :disabled="pagination.page >= pagination.pages" @click="load(pagination.page + 1)">Далее</UiButton>
    </nav>

    <UiDialog v-model="createOpen" title="Новый пользователь" description="Аккаунт создаётся через общий Mecorion API." size="lg" sticky-footer>
      <UiForm :loading="saving" :error="createError" @submit="createAccount">
        <div class="mc-form-grid">
          <UiInput v-model="form.displayName" label="Отображаемое имя" required />
          <UiInput v-model="form.username" label="Username" placeholder="Сформируется автоматически" />
          <UiInput v-model="form.email" label="Email" type="email" />
          <UiCheckbox v-model="form.verified" label="Email подтверждён" />
        </div>
        <div class="mc-stack"><p class="mc-field__label">Начальные роли</p><UiCheckbox v-for="role in roles" :key="role.code" v-model="form.roles" :value="role.code" :label="role.name" /></div>
        <template #actions><UiButton variant="ghost" @click="createOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Создать</UiButton></template>
      </UiForm>
    </UiDialog>
  </div>
</template>
