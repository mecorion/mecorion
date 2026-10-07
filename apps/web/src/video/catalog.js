import {getVideoServicePublications} from "@/spaces/spaces.mock.js";

const videoStateById = {
  "director-a-scenes": {progress: 42, watchedMinutes: 18, totalMinutes: 42, saved: true, kind: "Фильм", quality: "2160p", voice: "Оригинал", subtitles: "Русские"},
  "universe-a-order": {progress: 12, watchedMinutes: 4, totalMinutes: 28, saved: false, kind: "Подборка", quality: "1080p", voice: "Дубляж", subtitles: "English"},
};

const fallbackVideos = [
  {
    id: "video-series-01",
    type: "video",
    title: "Сериал: пилотный выпуск",
    subtitle: "Первый эпизод подборки с настройками качества",
    author: "Редакция Mecorion",
    duration: "52 мин",
    coverTone: "cyan",
    spaceId: "series",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские", "Без субтитров"], voice: ["Оригинал", "Дубляж"]},
    seasons: [
      {
        number: 1,
        title: "Сезон 1",
        episodes: [
          {id: "video-series-01-s1-e1", title: "Эпизод 1", duration: "52 мин", progress: 36},
          {id: "video-series-01-s1-e2", title: "Эпизод 2", duration: "48 мин", progress: 0},
          {id: "video-series-01-s1-e3", title: "Эпизод 3", duration: "51 мин", progress: 0},
        ],
      },
      {
        number: 2,
        title: "Сезон 2",
        episodes: [
          {id: "video-series-01-s2-e1", title: "Эпизод 1", duration: "50 мин", progress: 0},
          {id: "video-series-01-s2-e2", title: "Эпизод 2", duration: "47 мин", progress: 0},
        ],
      },
    ],
  },
  {
    id: "video-doc-01",
    type: "video",
    title: "Документальный выпуск",
    subtitle: "Спокойный длинный формат для вечернего просмотра",
    author: "Редакция Mecorion",
    duration: "1 ч 08 мин",
    coverTone: "blue",
    spaceId: "films",
    video: {quality: ["1440p", "1080p", "720p"], subtitles: ["Русские", "English"], voice: ["Оригинал"]},
  },
  {
    id: "video-drama-01",
    type: "video",
    title: "Дорама: тихий город",
    subtitle: "Мягкая история с сезонами, сериями и выбором озвучки",
    author: "Редакция Mecorion",
    duration: "46 мин",
    coverTone: "rose",
    spaceId: "series",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские", "English"], voice: ["Оригинал", "Дубляж"]},
    seasons: [
      {
        number: 1,
        title: "Сезон 1",
        episodes: [
          {id: "video-drama-01-s1-e1", title: "Эпизод 1", duration: "46 мин", progress: 0},
          {id: "video-drama-01-s1-e2", title: "Эпизод 2", duration: "44 мин", progress: 0},
          {id: "video-drama-01-s1-e3", title: "Эпизод 3", duration: "47 мин", progress: 0},
        ],
      },
    ],
  },
  {
    id: "video-animation-01",
    type: "video",
    title: "Анимационный выпуск",
    subtitle: "Короткий семейный формат для вечернего просмотра",
    author: "Редакция Mecorion",
    duration: "24 мин",
    coverTone: "green",
    spaceId: "anime",
    video: {quality: ["1080p", "720p"], subtitles: ["Русские"], voice: ["Дубляж"]},
  },
];

export const videoCatalog = [...getVideoServicePublications(), ...fallbackVideos].map((video, index) => ({
  ...video,
  views: video.views ?? [128400, 46700, 23100, 89500, 15200, 6400][index],
  publishedLabel: video.publishedLabel ?? ["4 дня назад", "неделю назад", "2 дня назад", "3 недели назад", "5 дней назад", "вчера"][index],
  state: videoStateById[video.id] ?? {
    progress: index % 2 ? 0 : 7,
    watchedMinutes: index % 2 ? 0 : 5,
    totalMinutes: Number.parseInt(video.duration, 10) || 45,
    saved: index % 2 === 0,
    kind: video.id.includes("drama") ? "Дорама" : video.id.includes("animation") ? "Мультфильм" : video.id.includes("doc") ? "Документальное" : video.seasons?.length ? "Сериал" : "Фильм",
    quality: video.video?.quality?.[0] ?? "1080p",
    voice: video.video?.voice?.[0] ?? "Оригинал",
    subtitles: video.video?.subtitles?.[0] ?? "Русские",
  },
}));


export function videoPath(id) { return `/video/${encodeURIComponent(id)}`; }
