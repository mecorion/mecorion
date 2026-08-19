const roleProfiles = {
  user: {
    role: "user",
    name: "Вадим",
    initials: "ВД",
    mecorionId: "7A3F9C",
    badge: "Новый пользователь",
    avatarTone: "rose",
    bio: "Привет! Я только начинаю свой путь в Mecorion. Изучаю возможности платформы и планирую делиться интересным контентом.",
    registeredAt: "27 мая 2024",
    language: "Русский",
    timezone: "GMT+3",
    stats: [
      {label: "Публикаций", value: "0", icon: "▤"},
      {label: "Пространств", value: "0", icon: "☁"},
      {label: "Подписчиков", value: "0", icon: "♙"},
    ],
    completion: {
      title: "Завершите настройку профиля",
      subtitle: "Чем подробнее ваш профиль, тем больше возможностей откроется в Mecorion.",
      progress: 40,
      caption: "Готово",
      steps: [
        {title: "Аккаунт создан", text: "Базовый профиль Mecorion готов.", done: true},
        {title: "Подтвердить Email", text: "Подтвердите вашу почту, чтобы обеспечить безопасность аккаунта.", done: false},
        {title: "Выбрать интересы", text: "Подберите темы, которые вам интересны.", done: false},
        {title: "Заполнить профиль", text: "Добавьте информацию о себе и расскажите о своих интересах.", done: false},
      ],
      action: "Продолжить настройку",
    },
    sections: {
      left: {
        title: "Интересы",
        subtitle: "Выберите темы, которые вам интересны",
        kind: "interests",
      },
      center: {
        title: "Быстрый старт",
        subtitle: "Несколько шагов для комфортного старта",
        kind: "quickStart",
      },
      right: {
        title: "Безопасность аккаунта",
        subtitle: "Ваш аккаунт защищён",
        kind: "security",
      },
    },
  },
  agent: {
    role: "agent",
    name: "София",
    initials: "СФ",
    mecorionId: "9E2C7A",
    badge: "Агент",
    avatarTone: "violet",
    bio: "Курирую контент и управляю публикациями в сообществах и тематических пространствах Mecorion.",
    registeredAt: "15 июн 2023",
    language: "Русский",
    timezone: "GMT+3",
    stats: [
      {label: "Публикаций", value: "128", icon: "▤"},
      {label: "Пространств", value: "6", icon: "☁"},
      {label: "Подписчиков", value: "15.3K", icon: "♙"},
    ],
    completion: {
      title: "Статус агента",
      subtitle: "Ваш прогресс и возможности в программе Agents.",
      progress: 4,
      caption: "Уровень",
      xp: "2 480 / 5 000 XP",
      steps: [
        {title: "Проверенный агент", text: "Ваша личность и активность проверены командой Mecorion.", done: true},
        {title: "Приглашён в программу Agents", text: "Вы имеете доступ к эксклюзивным инструментам и возможностям.", done: true},
      ],
      action: "Открыть панель агента",
    },
    sections: {
      left: {
        title: "Мои пространства",
        subtitle: "Пространства, которыми вы управляете",
        kind: "spaces",
      },
      center: {
        title: "Публикации и статистика",
        subtitle: "Обзор вашей активности",
        kind: "analytics",
      },
      right: {
        title: "Последняя активность",
        subtitle: "Ваши последние действия в Mecorion",
        kind: "activity",
      },
    },
  },
  moderator: {
    role: "moderator",
    name: "Алексей",
    initials: "АЛ",
    mecorionId: "8F3D7A",
    badge: "Модератор",
    avatarTone: "cyan",
    bio: "Помогаю поддерживать Mecorion безопасным и комфортным. Проверяю отчёты, принимаю решения и поддерживаю стандарты качества сообщества.",
    registeredAt: "18 фев 2023",
    language: "Русский",
    timezone: "GMT+3",
    stats: [
      {label: "Проверок", value: "842", icon: "◇"},
      {label: "Закрытых жалоб", value: "126", icon: "⚑"},
      {label: "Зоны ответственности", value: "4", icon: "⬡"},
    ],
    completion: {
      title: "Статус модератора",
      subtitle: "Ваши показатели и уровень доверия в сообществе.",
      progress: 92,
      caption: "Уровень доверия",
      steps: [
        {title: "Доверенный модератор", text: "Вы заслужили высокий уровень доверия благодаря качественной работе.", done: true},
        {title: "2FA включена", text: "Двухфакторная аутентификация активна.", done: true},
        {title: "Высокая точность решений", text: "Ваш показатель точности выше среднего по сообществу.", done: true},
      ],
      action: "Посмотреть статистику модерации",
    },
    sections: {
      left: {
        title: "Зоны модерации",
        subtitle: "Вы отвечаете за соблюдение правил в этих разделах.",
        kind: "moderationZones",
      },
      center: {
        title: "Сводка работы",
        subtitle: "Ваша активность за последние 7 дней.",
        kind: "moderationSummary",
      },
      right: {
        title: "Последние действия",
        subtitle: "Ваша модерационная активность.",
        kind: "moderationActivity",
      },
    },
  },
};

const fallbackRole = "user";

function getRoleFromLocation() {
  const role = new URLSearchParams(window.location.search).get("role");
  return roleProfiles[role] ? role : fallbackRole;
}

export async function fetchMockProfile() {
  // Имитация API оставляет страницу асинхронной: когда появится backend,
  // этот метод заменится на fetch('/api/v1/profile/me') без переделки view.
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return roleProfiles[getRoleFromLocation()];
}

export const profileRoles = Object.keys(roleProfiles);
