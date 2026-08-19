<script setup>
import {computed} from "vue";

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
});

const sectionContent = {
  interests: {
    intro: "Расскажите, что вам интересно",
    text: "Это поможет нам подбирать контент и людей, которые вам понравятся.",
    action: "Выбрать интересы",
    items: ["♫", "▻", "▥", "▶", "☆", "Aa"],
  },
  quickStart: {
    items: [
      ["✉", "Подтвердите Email", "Подтвердите почту для защиты аккаунта"],
      ["☆", "Выберите интересы", "Подпишитесь на любимые темы"],
      ["♙", "Заполните профиль", "Добавьте информацию о себе"],
      ["＋", "Создайте первое пространство", "Организуйте контент и участников"],
    ],
  },
  security: {
    items: [
      ["▣", "Пароль", "Надёжный", "ok"],
      ["◇", "Двухфакторная аутентификация", "Отключена", "next"],
      ["✉", "Email", "Не подтверждён", "next"],
    ],
    note: "Подтвердите Email, чтобы получить доступ ко всем функциям Mecorion и защитить аккаунт.",
  },
  spaces: {
    items: [
      ["♫", "Музыка будущего", "12.4K подписчиков · 86 публикаций", "Музыка"],
      ["▻", "Кинохаб", "8.7K подписчиков · 64 публикации", "Кино"],
      ["▥", "Книги и идеи", "5.2K подписчиков · 48 публикаций", "Литература"],
    ],
    action: "Создать новое пространство ＋",
  },
  analytics: {
    metrics: [
      ["Просмотры", "1.2M", "+14.3%"],
      ["Сохранения", "78.6K", "+18.7%"],
      ["Вовлечённость", "12.6%", "+21.4%"],
    ],
    action: "Перейти к аналитике →",
  },
  activity: {
    items: [
      ["▤", "Опубликована новая статья", "10 трендов в музыке 2024 года"],
      ["▣", "Комментарий в пространстве «Кинохаб»", "Отличный разбор. Полностью согласна с третьим пунктом."],
      ["♙", "Новые подписчики", "+236 за последние 24 часа"],
    ],
    action: "Посмотреть всю активность →",
  },
  moderationZones: {
    items: [
      ["♫", "Music", "Музыкальный контент, треки и исполнители", "Активна"],
      ["☁", "Spaces", "Аудио-комнаты и прямые эфиры", "Активна"],
      ["▣", "Комментарии", "Комментарии и обсуждения", "Активна"],
      ["☷", "Agents", "AI-агенты и пользовательские боты", "Активна"],
    ],
    action: "Управление зонами",
  },
  moderationSummary: {
    items: [
      ["▤", "Проверено отчётов", "156", "+23%"],
      ["⚑", "Обжалования", "18", "-10%"],
      ["◷", "Среднее время ответа", "2 ч 18 м", "-15%"],
      ["◎", "Точность модерации", "96%", "+6%"],
    ],
    action: "Полная статистика",
  },
  moderationActivity: {
    items: [
      ["Сегодня 14:32", "Жалоба рассмотрена", "Музыкальный трек удалён за нарушение авторских прав", "Music"],
      ["Сегодня 11:05", "Жалоба рассмотрена", "Спам в комментариях удалён", "Комментарии"],
      ["Вчера 19:47", "Обжалование обработано", "Решение подтверждено", "Spaces"],
      ["Вчера 16:21", "Пользователь предупреждён", "Нарушение правил поведения в чате", "Комментарии"],
    ],
    action: "Посмотреть всю историю",
  },
};

const content = computed(() => sectionContent[props.section.kind] ?? {});
</script>

<template>
  <div>
    <div class="profile-widget__header">
      <h2>{{ section.title }}</h2>
      <p>{{ section.subtitle }}</p>
    </div>

    <div v-if="section.kind === 'interests'" class="profile-interest-panel">
      <div><span v-for="item in content.items" :key="item">{{ item }}</span></div>
      <strong>{{ content.intro }}</strong>
      <p>{{ content.text }}</p>
      <button type="button">{{ content.action }}</button>
    </div>

    <div v-else-if="section.kind === 'analytics'" class="profile-analytics-panel">
      <div class="profile-analytics-metrics">
        <article v-for="metric in content.metrics" :key="metric[0]">
          <span>{{ metric[0] }}</span>
          <strong>{{ metric[1] }}</strong>
          <small>{{ metric[2] }}</small>
        </article>
      </div>
      <div class="profile-chart" aria-hidden="true"><i v-for="n in 9" :key="n"></i></div>
      <button type="button">{{ content.action }}</button>
    </div>

    <div v-else class="profile-list-panel">
      <article v-for="item in content.items" :key="item[1]" class="profile-list-item">
        <span>{{ item[0] }}</span>
        <div>
          <strong>{{ item[1] }}</strong>
          <p>{{ item[2] }}</p>
        </div>
        <small v-if="item[3]">{{ item[3] }}</small>
      </article>
      <p v-if="content.note" class="profile-note">{{ content.note }}</p>
      <button v-if="content.action" type="button">{{ content.action }} →</button>
    </div>
  </div>
</template>
