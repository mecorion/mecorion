<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";

definePageMeta({title: "Управление Mecorion"});

interface NavigationGroup {id: string; code: string; label: string | null; placement: "MAIN" | "FOOTER"; sortOrder: number; isEnabled: boolean}
interface NavigationItem {
  id: string; code: string; label: string; icon: string; route: string; componentKey: string;
  sortOrder: number; isEnabled: boolean; groupCode: string; visibilityRoles: string[]; accessRoles: string[];
}
interface Role {code: string; name: string; isSystemManaged: boolean}
interface NavigationResponse {
  groups: NavigationGroup[]; items: NavigationItem[]; roles: Role[];
  iconOptions: string[]; componentOptions: string[];
}

const client = useAdminClient();
const data = reactive<NavigationResponse>({groups: [], items: [], roles: [], iconOptions: [], componentOptions: []});
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const itemDialogOpen = ref(false);
const groupDialogOpen = ref(false);
const editingItemId = ref("");
const editingGroupId = ref("");
const itemForm = reactive({label: "", icon: "home", componentKey: "page.dashboard", groupCode: "MAIN", sortOrder: 0, isEnabled: true, visibilityRoleCodes: [] as string[], accessRoleCodes: [] as string[]});
const groupForm = reactive({label: "", sortOrder: 0, isEnabled: true});

const groupOptions = computed(() => data.groups.map((group) => ({label: group.label || group.code, value: group.code})));
const iconOptions = computed(() => data.iconOptions.map((icon) => ({label: icon, value: icon})));
const componentOptions = computed(() => data.componentOptions.map((component) => ({label: component, value: component})));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    Object.assign(data, await client.request<NavigationResponse>("/api/v1/admin/platform/navigation"));
  } catch (caught: any) {
    error.value = caught.message || "Не удалось загрузить конфигурацию Mecorion";
  } finally {
    loading.value = false;
  }
}

function editItem(item: NavigationItem) {
  editingItemId.value = item.id;
  Object.assign(itemForm, {
    label: item.label, icon: item.icon, componentKey: item.componentKey,
    groupCode: item.groupCode, sortOrder: item.sortOrder, isEnabled: item.isEnabled,
    visibilityRoleCodes: [...item.visibilityRoles], accessRoleCodes: [...item.accessRoles],
  });
  itemDialogOpen.value = true;
}

function editGroup(group: NavigationGroup) {
  editingGroupId.value = group.id;
  Object.assign(groupForm, {label: group.label || "", sortOrder: group.sortOrder, isEnabled: group.isEnabled});
  groupDialogOpen.value = true;
}

async function saveItem() {
  saving.value = true;
  error.value = "";
  try {
    await client.request(`/api/v1/admin/platform/navigation/items/${editingItemId.value}`, {method: "PATCH", body: JSON.stringify(itemForm)});
    itemDialogOpen.value = false;
    await load();
  } catch (caught: any) {
    error.value = caught.message || "Не удалось сохранить пункт";
  } finally {
    saving.value = false;
  }
}

async function saveGroup() {
  saving.value = true;
  error.value = "";
  try {
    await client.request(`/api/v1/admin/platform/navigation/groups/${editingGroupId.value}`, {method: "PATCH", body: JSON.stringify({...groupForm, label: groupForm.label || null})});
    groupDialogOpen.value = false;
    await load();
  } catch (caught: any) {
    error.value = caught.message || "Не удалось сохранить группу";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div>
        <p class="admin-eyebrow">Platform UI registry</p>
        <h1 class="text-title">Управление Mecorion</h1>
        <p class="text-subtitle">Sidebar и доступ к страницам основного сервиса. Скрытие пункта и запрет прямого перехода настраиваются независимо.</p>
      </div>
      <UiButton variant="outline" :loading="loading" @click="load">Обновить</UiButton>
    </header>

    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка конфигурации…" />
    <template v-else>
      <section class="mc-section" aria-labelledby="groups-title">
        <div class="admin-section-heading"><div><p class="text-caption">Структура sidebar</p><h2 id="groups-title">Группы</h2></div></div>
        <div class="admin-module-grid">
          <UiCard v-for="group in data.groups" :key="group.id" :title="group.label || 'Основная группа'" :description="`${group.code} · ${group.placement}`">
            <template #action><span class="mc-chip">{{ group.isEnabled ? "Включена" : "Отключена" }}</span></template>
            <div class="admin-data-row"><span>Порядок</span><strong>{{ group.sortOrder }}</strong></div>
            <UiButton variant="outline" size="sm" @click="editGroup(group)">Настроить группу</UiButton>
          </UiCard>
        </div>
      </section>

      <section class="mc-section" aria-labelledby="items-title">
        <div class="admin-section-heading"><div><p class="text-caption">Страницы и доступ</p><h2 id="items-title">Пункты sidebar</h2></div><span class="text-caption">{{ data.items.length }} пунктов</span></div>
        <div class="admin-list">
          <UiCard v-for="item in data.items" :key="item.id" :title="item.label" :description="`${item.route} · ${item.componentKey}`">
            <template #action><UiButton variant="outline" size="sm" @click="editItem(item)">Изменить</UiButton></template>
            <div class="admin-detail-grid">
              <div class="admin-data-row"><span>Группа</span><strong>{{ item.groupCode }}</strong></div>
              <div class="admin-data-row"><span>Иконка</span><strong>{{ item.icon }}</strong></div>
              <div class="admin-data-row"><span>Состояние</span><strong>{{ item.isEnabled ? "Включён" : "Отключён" }}</strong></div>
            </div>
            <div class="admin-meta">
              <span class="mc-chip">Видят: {{ item.visibilityRoles.length ? item.visibilityRoles.join(", ") : "все" }}</span>
              <span class="mc-chip">Открывают: {{ item.accessRoles.length ? item.accessRoles.join(", ") : "все" }}</span>
            </div>
          </UiCard>
        </div>
      </section>
    </template>

    <UiDialog v-model="itemDialogOpen" title="Настройка пункта sidebar" description="Видимость управляет ссылкой, доступ — прямым переходом на route." size="xl" sticky-footer>
      <UiForm :loading="saving" :error="error" @submit="saveItem">
        <div class="mc-form-grid">
          <UiInput v-model="itemForm.label" label="Название" required />
          <UiSelect v-model="itemForm.icon" label="Иконка" :options="iconOptions" />
          <UiSelect v-model="itemForm.groupCode" label="Группа" :options="groupOptions" />
          <UiSelect v-model="itemForm.componentKey" label="Компонент страницы" :options="componentOptions" />
          <UiInput v-model="itemForm.sortOrder" label="Порядок" type="number" min="0" />
          <UiCheckbox v-model="itemForm.isEnabled" label="Пункт включён" description="Отключённый пункт скрыт и возвращает 404 для всех ролей." />
        </div>
        <div class="admin-detail-grid">
          <UiCard title="Кто видит пункт" description="Пустой список — все авторизованные пользователи.">
            <div class="mc-stack"><UiCheckbox v-for="role in data.roles" :key="`view-${role.code}`" v-model="itemForm.visibilityRoleCodes" :value="role.code" :label="role.name" :description="role.code" /></div>
          </UiCard>
          <UiCard title="Кто открывает страницу" description="Для остальных прямой URL вернёт 404.">
            <div class="mc-stack"><UiCheckbox v-for="role in data.roles" :key="`access-${role.code}`" v-model="itemForm.accessRoleCodes" :value="role.code" :label="role.name" :description="role.code" /></div>
          </UiCard>
        </div>
        <template #actions><UiButton variant="ghost" @click="itemDialogOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>

    <UiDialog v-model="groupDialogOpen" title="Настройка группы" size="lg">
      <UiForm :loading="saving" :error="error" @submit="saveGroup">
        <div class="mc-form-grid"><UiInput v-model="groupForm.label" label="Заголовок" /><UiInput v-model="groupForm.sortOrder" label="Порядок" type="number" min="0" /><UiCheckbox v-model="groupForm.isEnabled" label="Группа включена" /></div>
        <template #actions><UiButton variant="ghost" @click="groupDialogOpen = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>
  </div>
</template>
