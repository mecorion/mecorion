<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Роли и доступ"});

interface Role {id: string; code: string; name: string; description: string | null; roleType: string; requiresGovernanceIdentity: boolean; isSystemManaged: boolean; isActive: boolean; assignmentCount: number; permissions: string[]}
interface Permission {id: string; code: string; name: string; description: string | null; serviceCode: string; serviceName: string; isActive: boolean}

const client = useAdminClient();
const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const roleTypes = ref<{code: string; name: string}[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const createOpen = ref(false);
const form = reactive({roleTypeCode: "SYSTEM", code: "", name: "", description: "", requiresGovernanceIdentity: false, permissionCodes: [] as string[]});

const typeOptions = computed(() => roleTypes.value.map((item) => ({label: item.name, value: item.code})));
const permissionGroups = computed(() => Object.entries(permissions.value.reduce<Record<string, Permission[]>>((groups, permission) => {
  (groups[permission.serviceName] ||= []).push(permission);
  return groups;
}, {})));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [roleResponse, permissionResponse] = await Promise.all([
      client.request<{items: Role[]; roleTypes: {code: string; name: string}[]}>("/api/v1/admin/roles"),
      client.request<{items: Permission[]}>("/api/v1/admin/permissions"),
    ]);
    roles.value = roleResponse.items;
    roleTypes.value = roleResponse.roleTypes;
    permissions.value = permissionResponse.items;
  } catch (caught: any) {
    error.value = caught.message || "Не удалось загрузить модель доступа";
  } finally {
    loading.value = false;
  }
}

async function createRole() {
  saving.value = true;
  error.value = "";
  try {
    await client.request("/api/v1/admin/roles", {method: "POST", body: JSON.stringify({...form, description: form.description || null})});
    createOpen.value = false;
    Object.assign(form, {roleTypeCode: "SYSTEM", code: "", name: "", description: "", requiresGovernanceIdentity: false, permissionCodes: []});
    await load();
  } catch (caught: any) {
    error.value = caught.message || "Не удалось создать роль";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div><p class="admin-eyebrow">Access control</p><h1 class="text-title">Роли и доступ</h1><p class="text-subtitle">Единая модель ролей и разрешений для всех сервисов Mecorion.</p></div>
      <UiButton variant="primary" @click="createOpen = true"><AdminIcon name="shield" />Создать роль</UiButton>
    </header>

    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка модели доступа…" />
    <template v-else>
      <section class="mc-section" aria-labelledby="roles-title">
        <div class="admin-section-heading"><div><p class="text-caption">Role-based access</p><h2 id="roles-title">Роли</h2></div><span class="text-caption">{{ roles.length }} ролей</span></div>
        <div class="admin-module-grid">
          <UiCard v-for="role in roles" :key="role.id" :title="role.name" :description="role.description || 'Описание не задано'">
            <template #action><span class="mc-chip">{{ role.code }}</span></template>
            <div class="mc-stack">
              <p class="mc-text-sm">{{ role.roleType }} · {{ role.assignmentCount }} назначений</p>
              <div class="admin-meta"><span v-for="permission in role.permissions" :key="permission" class="mc-chip">{{ permission }}</span><span v-if="!role.permissions.length" class="mc-text-sm">Нет разрешений</span></div>
              <p class="mc-caption">{{ role.isSystemManaged ? "Системная роль" : "Пользовательская роль" }} · {{ role.isActive ? "активна" : "отключена" }}</p>
            </div>
          </UiCard>
        </div>
      </section>

      <section class="mc-section" aria-labelledby="permissions-title">
        <div class="admin-section-heading"><div><p class="text-caption">Permission catalog</p><h2 id="permissions-title">Разрешения</h2></div><span class="text-caption">{{ permissions.length }} разрешений</span></div>
        <div class="admin-detail-grid">
          <UiCard v-for="[service, items] in permissionGroups" :key="service" :title="service" :description="`${items.length} разрешений`">
            <div class="mc-stack">
              <div v-for="permission in items" :key="permission.id" class="admin-data-row">
                <div><strong>{{ permission.name }}</strong><p class="mc-text-sm">{{ permission.code }}</p></div>
              </div>
            </div>
          </UiCard>
        </div>
      </section>
    </template>

    <UiDialog v-model="createOpen" title="Новая роль" description="Код роли после создания не изменяется." size="xl" sticky-footer>
      <UiForm :loading="saving" :error="error" @submit="createRole">
        <div class="mc-form-grid">
          <UiSelect v-model="form.roleTypeCode" label="Тип роли" :options="typeOptions" />
          <UiInput v-model="form.code" label="Код" placeholder="CONTENT_EDITOR" required />
          <UiInput v-model="form.name" label="Название" required />
          <UiCheckbox v-model="form.requiresGovernanceIdentity" label="Требуется подтверждённая личность" />
        </div>
        <UiTextarea v-model="form.description" label="Описание" rows="3" />
        <div class="mc-stack">
          <p class="mc-field__label">Разрешения</p>
          <div class="admin-check-grid mc-scroll">
            <template v-for="[service, items] in permissionGroups" :key="service">
              <p class="mc-caption">{{ service }}</p>
              <div class="mc-stack"><UiCheckbox v-for="permission in items" :key="permission.code" v-model="form.permissionCodes" :value="permission.code" :label="permission.name" :description="permission.code" /></div>
            </template>
          </div>
        </div>
        <template #actions><UiButton variant="ghost" @click="createOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Создать роль</UiButton></template>
      </UiForm>
    </UiDialog>
  </div>
</template>
