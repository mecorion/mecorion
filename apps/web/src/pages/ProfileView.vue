<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import ProfileSection from "@/components/profile/ProfileSection.vue";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout.vue";
import {fetchMockProfile, profileRoles} from "@/profile/profile.mock.js";

const route = useRoute();
const router = useRouter();
const profile = ref(null);
const isLoading = ref(true);

const roleTitle = {
  user: "Профиль пользователя",
  agent: "Профиль агента",
  moderator: "Профиль модератора",
};

const roleOptions = [
  {role: "user", label: "Пользователь"},
  {role: "agent", label: "Агент"},
  {role: "moderator", label: "Модератор"},
];

const selectedRole = computed(() => {
  const role = String(route.query.role ?? "user");
  return profileRoles.includes(role) ? role : "user";
});

async function loadProfile() {
  isLoading.value = true;
  profile.value = await fetchMockProfile();
  isLoading.value = false;
}

function changeRole(role) {
  router.push({path: "/profile", query: {role}});
}

onMounted(loadProfile);

watch(
  () => route.query.role,
  () => {
    loadProfile();
  },
);
</script>

<template>
  <WorkspaceLayout>
    <main class="profile-page">
      <section class="profile-role-switch" aria-label="Mock роли пользователя">
        <span>Mock API роль:</span>
        <button
          v-for="option in roleOptions"
          :key="option.role"
          type="button"
          :class="{'profile-role-switch__item--active': selectedRole === option.role}"
          class="profile-role-switch__item"
          @click="changeRole(option.role)"
        >
          {{ option.label }}
        </button>
      </section>

      <section v-if="isLoading" class="profile-loading">
        <span></span>
        <p>Загружаем профиль Mecorion...</p>
      </section>

      <template v-else-if="profile">
        <section class="profile-hero-grid">
          <article class="profile-card profile-card--identity">
            <div class="profile-avatar" :class="`profile-avatar--${profile.avatarTone}`">
              <span>{{ profile.initials }}</span>
              <button type="button" aria-label="Изменить аватар">▣</button>
            </div>

            <div class="profile-identity">
              <p class="workspace-eyebrow">{{ roleTitle[profile.role] }}</p>
              <h1>{{ profile.name }} <span>{{ profile.badge }}</span></h1>
              <p class="profile-id">Mecorion ID: <strong>#{{ profile.mecorionId }}</strong> <button type="button" aria-label="Скопировать ID">⧉</button></p>
              <p class="profile-bio">{{ profile.bio }}</p>
              <div class="profile-actions">
                <button class="profile-primary-action" type="button">✎ Редактировать профиль</button>
                <button class="profile-secondary-action" type="button">{{ profile.role === 'user' ? '✉ Подтвердить Email' : profile.role === 'agent' ? '↗ Поделиться профилем' : '□ Настройки уведомлений' }}</button>
              </div>
            </div>

            <dl class="profile-meta">
              <div><dt>Дата регистрации</dt><dd>▣ {{ profile.registeredAt }}</dd></div>
              <div><dt>Язык интерфейса</dt><dd>◎ {{ profile.language }}</dd></div>
              <div><dt>Часовой пояс</dt><dd>◷ {{ profile.timezone }}</dd></div>
            </dl>
          </article>

          <article class="profile-card profile-card--status">
            <div class="profile-status-copy">
              <h2>{{ profile.completion.title }}</h2>
              <p>{{ profile.completion.subtitle }}</p>
            </div>

            <div class="profile-status-layout">
              <div class="profile-progress-ring" :style="{'--profile-progress': `${profile.completion.progress}%`}">
                <strong>{{ profile.role === 'agent' ? profile.completion.progress : `${profile.completion.progress}%` }}</strong>
                <span>{{ profile.completion.caption }}</span>
              </div>

              <div class="profile-status-list">
                <article v-for="step in profile.completion.steps" :key="step.title" :class="{'profile-status-step--done': step.done}" class="profile-status-step">
                  <span>{{ step.done ? '✓' : '○' }}</span>
                  <div>
                    <strong>{{ step.title }}</strong>
                    <p>{{ step.text }}</p>
                  </div>
                </article>
              </div>
            </div>

            <div v-if="profile.completion.xp" class="profile-xp">
              <span>До уровня 5</span>
              <strong>{{ profile.completion.xp }}</strong>
              <i></i>
            </div>

            <button class="profile-wide-action" type="button">{{ profile.completion.action }} →</button>
          </article>
        </section>

        <section class="profile-stat-strip">
          <article v-for="stat in profile.stats" :key="stat.label">
            <span>{{ stat.icon }}</span>
            <strong>{{ stat.value }}</strong>
            <p>{{ stat.label }}</p>
          </article>
        </section>

        <section class="profile-widgets">
          <article class="profile-card profile-widget">
            <ProfileSection :section="profile.sections.left" />
          </article>

          <article class="profile-card profile-widget">
            <ProfileSection :section="profile.sections.center" />
          </article>

          <article class="profile-card profile-widget profile-widget--wide">
            <ProfileSection :section="profile.sections.right" />
          </article>
        </section>
      </template>

      <footer class="profile-footer">
        <a href="#">Помощь</a>
        <a href="#">Безопасность</a>
        <a href="#">Конфиденциальность</a>
        <a href="#">Условия использования</a>
        <span>◎ Русский⌄</span>
      </footer>
    </main>
  </WorkspaceLayout>
</template>
