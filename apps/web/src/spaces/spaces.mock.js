export const spaceFilters = ["Все", "Медиа", "Образование", "Софт", "Игры", "Книги", "Подкасты", "Документы"];

export const publicationTypeLabels = {
  book: "Книга",
  collection: "Сборник",
  video: "Видео",
  article: "Статья",
  audio: "Аудио",
  document: "Документ",
};

export const rootSpaces = [
  {
    id: "anime",
    title: "Аниме",
    icon: "✹",
    category: "Медиа",
    description: "Тайтлы, озвучки, субтитры и сообщества для фанатов.",
    posts: "12.4K",
    members: "89.6K",
    tone: "sunset",
    size: "wide",
    summary: "Каталог аниме-публикаций, фанатских подборок, обсуждений релизов и переводов.",
    subspaces: [
      {id: "anime-action", title: "Экшен", description: "Боевые тайтлы, арки, персонажи и рейтинги."},
      {id: "anime-authors", title: "Авторская анимация", description: "Фильмы, артбуки и обсуждения студий."},
      {id: "anime-future", title: "Будущее", description: "Неон, технологии и антиутопии."},
    ],
  },
  {
    id: "films",
    title: "Фильмы",
    icon: "▦",
    category: "Медиа",
    description: "Коллекции фильмов, обсуждения, подборки и премьеры.",
    posts: "8.7K",
    members: "56.3K",
    tone: "planet",
    size: "wide",
    summary: "Общее пространство фильмов: вселенные, режиссёры, подборки, релизы и обсуждения.",
    subspaces: [
      {id: "films-universe-a", title: "Вселенная 1", description: "Фазы, персонажи, сериалы и таймлайн."},
      {id: "films-universe-b", title: "Вселенная 2", description: "Герои, анимация и альтернативные истории."},
      {id: "films-director-a", title: "Режиссёр 1", description: "Фильмы, разборы и операторские решения."},
      {id: "films-classics", title: "Классика", description: "Киноархив, восстановленные релизы и эссе."},
    ],
  },
  {
    id: "series",
    title: "Сериалы",
    icon: "▣",
    category: "Медиа",
    description: "Популярные сериалы, новинки и расписание эпизодов.",
    posts: "6.1K",
    members: "41.2K",
    tone: "city",
    subspaces: [
      {id: "series-studio", title: "Студия 1", description: "Большие сериалы, премьеры и обсуждения сезонов."},
      {id: "series-detective", title: "Детективы", description: "Расследования, нуар и криминальные истории."},
    ],
  },
  {
    id: "software",
    title: "Программы",
    icon: "▤",
    category: "Софт",
    description: "Софт для работы, учёбы и повседневных задач.",
    posts: "3.2K",
    members: "22.7K",
    tone: "wave",
    subspaces: [
      {id: "software-ide", title: "IDE", description: "Редакторы, плагины, настройки и рабочие наборы."},
      {id: "software-design", title: "Дизайн-инструменты", description: "Графика, интерфейсы, 3D и дизайн-пайплайны."},
    ],
  },
  {
    id: "games",
    title: "Игры",
    icon: "▰",
    category: "Игры",
    description: "Игры на любой платформе и для любого игрока.",
    posts: "9.8K",
    members: "67.1K",
    tone: "mountain",
    subspaces: [
      {id: "games-studio-a", title: "Студия 1", description: "Открытые миры, моды и серверы."},
      {id: "games-studio-b", title: "Студия 2", description: "Ролевые игры, миры будущего и лор."},
      {id: "games-indie", title: "Независимые игры", description: "Небольшие студии, находки и эксперименты."},
    ],
  },
  {
    id: "music",
    title: "Музыка",
    icon: "♫",
    category: "Медиа",
    description: "Жанры, артисты, плейлисты и живые обсуждения.",
    posts: "15.2K",
    members: "103K",
    tone: "stage",
    subspaces: [
      {id: "music-rock", title: "Rock", description: "Альбомы, концерты, гитары и истории групп."},
      {id: "music-electronic", title: "Electronic", description: "Сеты, лейблы, саунд-дизайн и клубная сцена."},
      {id: "music-soundtracks", title: "Soundtracks", description: "Музыка к фильмам, играм и сериалам."},
    ],
  },
  {
    id: "books",
    title: "Книги",
    icon: "▥",
    category: "Книги",
    description: "Художественная, научная и учебная литература.",
    posts: "7.5K",
    members: "49.8K",
    tone: "library",
    summary: "Главное пространство литературы: авторы, сборники, чтение, заметки и рекомендации.",
    subspaces: [
      {id: "books-author-a", title: "Автор 1", description: "Произведения, сборники, письма и критика."},
      {id: "books-sci-fi", title: "Научная фантастика", description: "Миры будущего, космос и технологии."},
      {id: "books-non-fiction", title: "Non-fiction", description: "Наука, история, мышление и практические книги."},
      {id: "books-audio", title: "Аудиокниги", description: "Озвученные издания и подборки дикторов."},
    ],
  },
  {
    id: "podcasts",
    title: "Подкасты",
    icon: "◍",
    category: "Подкасты",
    description: "Разговоры, интервью и аудиоистории на любые темы.",
    posts: "2.9K",
    members: "18.3K",
    tone: "studio",
    subspaces: [
      {id: "podcasts-tech", title: "Технологии", description: "Инженерия, продукты и IT-культура."},
      {id: "podcasts-history", title: "История", description: "События, личности и долгие форматы."},
    ],
  },
  {
    id: "documents",
    title: "Документы",
    icon: "□",
    category: "Документы",
    description: "Шаблоны, руководства и учебные материалы.",
    posts: "1.8K",
    members: "11.6K",
    tone: "docs",
    subspaces: [
      {id: "documents-guides", title: "Руководства", description: "How-to, инструкции и методички."},
      {id: "documents-templates", title: "Шаблоны", description: "Формы, таблицы, презентации и PDF."},
    ],
  },
  {
    id: "learn",
    title: "Обучение",
    icon: "◒",
    category: "Образование",
    description: "Курсы, лекции, туториалы и методички.",
    posts: "3.6K",
    members: "27.9K",
    tone: "learn",
    subspaces: [
      {id: "learn-programming", title: "Программирование", description: "Frontend, backend, базы данных и архитектура."},
      {id: "learn-design", title: "Дизайн", description: "UI, UX, графика и дизайн-системы."},
    ],
  },
  {
    id: "news",
    title: "Новости",
    icon: "◎",
    category: "Медиа",
    description: "Главные события и обсуждения дня.",
    posts: "1.2K",
    members: "8.7K",
    tone: "news",
    subspaces: [
      {id: "news-tech", title: "Технологии", description: "Индустрия, устройства, компании и релизы."},
      {id: "news-culture", title: "Культура", description: "Кино, музыка, книги и события."},
    ],
  },
];

export const publications = [
  {
    id: "author-a-selected",
    spaceId: "books",
    subspaceId: "books-author-a",
    type: "collection",
    title: "Автор 1: избранные произведения",
    subtitle: "Сборник стихотворений, прозы и драматургии",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "18 произведений",
    coverTone: "paper",
    body: "Сборник объединяет ключевые произведения автора, краткие примечания и читательские закладки. В будущем здесь появится синхронизация прогресса чтения и заметки.",
    items: ["Произведение 1", "Произведение 2", "Произведение 3", "Произведение 4"],
    comments: [
      {author: "Иван", text: "Удобно, что всё собрано в одном пространстве.", time: "12 мин назад"},
      {author: "Имя", text: "Нужны ещё заметки по главам и цитаты.", time: "1 ч назад"},
    ],
  },
  {
    id: "sci-fi-guide",
    spaceId: "books",
    subspaceId: "books-sci-fi",
    type: "book",
    title: "Фантастический цикл: путеводитель",
    subtitle: "Книга и читательский разбор",
    author: "Редакция Mecorion",
    year: "1951 / 2026",
    duration: "412 страниц",
    coverTone: "violet",
    body: "Публикация показывает, как книжный контент живёт внутри пространства и одновременно попадает в сервис Book.",
    comments: [
      {author: "Иван", text: "Хороший формат для длинных циклов.", time: "вчера"},
    ],
  },
  {
    id: "director-a-scenes",
    spaceId: "films",
    subspaceId: "films-director-a",
    type: "video",
    title: "Режиссёр 1: разбор крупных сцен",
    subtitle: "Видео с качеством, субтитрами и дорожками озвучки",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "42 мин",
    coverTone: "space",
    body: "Видео-публикация демонстрирует параметры просмотра: качество, субтитры и озвучка. В будущем эти настройки будут идти из media-worker и API.",
    video: {
      quality: ["2160p", "1440p", "1080p", "720p"],
      subtitles: ["Русские", "English", "Без субтитров"],
      voice: ["Оригинал", "Дубляж", "Комментарий автора"],
    },
    comments: [
      {author: "Иван", text: "Нужен таймлайн с главами.", time: "5 мин назад"},
      {author: "Имя", text: "Классно, если настройки сохранятся на аккаунте.", time: "2 ч назад"},
    ],
  },
  {
    id: "universe-a-order",
    spaceId: "films",
    subspaceId: "films-universe-a",
    type: "video",
    title: "Вселенная 1: порядок просмотра",
    subtitle: "Подборка и видео-гайд",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "28 мин",
    coverTone: "rose",
    body: "Пример публикации подпространства. Через сервис Video такие публикации будут собираться в общий каталог фильмов.",
    video: {
      quality: ["1080p", "720p"],
      subtitles: ["Русские", "English"],
      voice: ["Оригинал", "Дубляж"],
    },
    comments: [
      {author: "Иван", text: "Нужно добавить связку с персонажами и таймлайном.", time: "сегодня"},
    ],
  },
  {
    id: "open-world-history",
    spaceId: "games",
    subspaceId: "games-studio-a",
    type: "article",
    title: "Студия 1: эволюция открытого мира",
    subtitle: "Открытые миры и дизайн живых городов",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "12 мин чтения",
    coverTone: "orange",
    body: "Публикация показывает, как игровые пространства могут хранить лонгриды, подборки, видео и файлы модификаций.",
    comments: [
      {author: "Иван", text: "Для игр нужен отдельный тип публикации с системными требованиями.", time: "3 ч назад"},
    ],
  },
  {
    id: "game-lore",
    spaceId: "games",
    subspaceId: "games-studio-b",
    type: "collection",
    title: "Игровой мир: лор и книги",
    subtitle: "Сборник материалов по игровой вселенной",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "9 материалов",
    coverTone: "forest",
    body: "Сборник связывает игровые материалы и книжный контент. Такие публикации могут отображаться и в Game, и в Book при правильной категоризации.",
    items: ["Хронология книг", "Игровой канон", "Персонажи", "Карты мира"],
    comments: [],
  },
  {
    id: "soundtrack-space",
    spaceId: "music",
    subspaceId: "music-soundtracks",
    type: "audio",
    title: "Космические саундтреки",
    subtitle: "Подборка музыки из фильмов и игр",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "1 ч 12 мин",
    coverTone: "cyan",
    body: "Музыкальная публикация остаётся частью пространства, но сервис Music должен агрегировать все такие подборки в один удобный каталог.",
    comments: [
      {author: "Иван", text: "Хочу подписку на обновления подборки.", time: "вчера"},
    ],
  },
  {
    id: "ui-guides",
    spaceId: "documents",
    subspaceId: "documents-guides",
    type: "document",
    title: "Правила публикаций",
    subtitle: "Документ для авторов пространств",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "PDF",
    coverTone: "blue",
    body: "Документ описывает требования к публикациям, обложкам и связям с сервисами платформы.",
    comments: [],
  },
  {
    id: "frontend-course-start",
    spaceId: "learn",
    subspaceId: "learn-programming",
    type: "collection",
    title: "Frontend: стартовый курс",
    subtitle: "Лекции, задания и материалы",
    author: "Редакция Mecorion",
    year: "2026",
    duration: "14 уроков",
    coverTone: "green",
    body: "Пример будущей интеграции Course: курс живёт в пространстве, а сервис Course сможет собрать все опубликованные курсы.",
    items: ["Раздел 1", "Раздел 2", "Раздел 3", "API"],
    comments: [
      {author: "Иван", text: "Нужен прогресс прохождения.", time: "4 ч назад"},
    ],
  },
];

const spaceById = new Map(rootSpaces.map((space) => [space.id, space]));
const subspaceById = new Map(rootSpaces.flatMap((space) => space.subspaces.map((subspace) => [subspace.id, {...subspace, parentId: space.id}])));
const publicationsById = new Map(publications.map((publication) => [publication.id, publication]));

export const featuredSpaces = rootSpaces.slice(0, 8);
export const compactSpaces = rootSpaces.slice(8);

export function getAllSpaces() {
  return rootSpaces;
}

export function getSpaceById(spaceId) {
  return spaceById.get(spaceId);
}

export function getSubspaceById(subspaceId) {
  return subspaceById.get(subspaceId);
}

export function getPublicationById(publicationId) {
  return publicationsById.get(publicationId);
}

export function getPublicationsBySpace(spaceId) {
  const subspaceIds = new Set(getSpaceById(spaceId)?.subspaces.map((subspace) => subspace.id) ?? []);

  return publications.filter((publication) => publication.spaceId === spaceId || subspaceIds.has(publication.subspaceId));
}

export function getPublicationsBySubspace(subspaceId) {
  return publications.filter((publication) => publication.subspaceId === subspaceId);
}

export function getBookServicePublications() {
  return publications.filter((publication) => ["book", "collection"].includes(publication.type));
}

export function getVideoServicePublications() {
  return publications.filter((publication) => publication.type === "video");
}

export function getSpaceBreadcrumb(publication) {
  const space = getSpaceById(publication.spaceId);
  const subspace = getSubspaceById(publication.subspaceId);

  return [space?.title, subspace?.title].filter(Boolean).join(" / ");
}
