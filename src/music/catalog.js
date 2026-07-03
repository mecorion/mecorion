// Суффикс ?url обязателен: vite-svg-loader без него импортирует SVG как
// Vue-компонент, тогда как каталог должен передать обычный URL в <img>.
import forestCover from "@/assets/images/music/forest-night.svg?url";
import neonCover from "@/assets/images/music/neon-drive.svg?url";
import stadiumCover from "@/assets/images/music/stadium-light.svg?url";

// Vite превращает найденные локальные файлы в URL. UI работает с обычными
// Track-объектами и не знает, откуда пришел звук: из assets, API или CDN.
const localAudioFiles = import.meta.glob("../assets/music/*.{mp3,ogg,wav,m4a,flac}", {
  eager: true,
  import: "default",
  query: "?url",
});

const audioByFilename = Object.fromEntries(
  Object.entries(localAudioFiles).map(([path, source]) => [path.split("/").pop(), source]),
);

const trackDefinitions = [
  {
    id: "track-lesnik",
    filename: "Korol_i_SHut_-_Lesnik_62571704.mp3",
    title: "Лесник",
    artist: "Король и Шут",
    album: "Будь как дома, Путник...",
    year: 1997,
    durationLabel: "3:11",
    cover: forestCover,
    accent: "rose",
  },
  {
    id: "track-love-you",
    filename: "DJ_Snake_Justin_Bieber_-_Let_Me_Love_You_47962926.mp3",
    title: "Let Me Love You",
    artist: "DJ Snake, Justin Bieber",
    album: "Encore",
    year: 2016,
    durationLabel: "3:25",
    cover: neonCover,
    accent: "cyan",
  },
  {
    id: "track-my-life",
    filename: "Bon_Jovi_-_Its_My_Life_47852367.mp3",
    title: "It's My Life",
    artist: "Bon Jovi",
    album: "Crush",
    year: 2000,
    durationLabel: "3:44",
    cover: stadiumCover,
    accent: "violet",
  },
];

export const musicTracks = trackDefinitions.map((track) => ({
  ...track,
  source: audioByFilename[track.filename] ?? null,
  available: Boolean(audioByFilename[track.filename]),
}));

export const musicPlaylists = [
  {
    id: "playlist-evening",
    title: "Вечерний поток",
    description: "Знакомые песни для спокойного вечера",
    cover: neonCover,
    trackIds: ["track-love-you", "track-lesnik", "track-my-life"],
    accent: "cyan",
  },
  {
    id: "playlist-energy",
    title: "На полной громкости",
    description: "Гитары, энергия и песни, которые знаешь наизусть",
    cover: stadiumCover,
    trackIds: ["track-my-life", "track-lesnik", "track-love-you"],
    accent: "rose",
  },
  {
    id: "playlist-stories",
    title: "Истории в наушниках",
    description: "Музыка с характером и сильным сюжетом",
    cover: forestCover,
    trackIds: ["track-lesnik", "track-my-life", "track-love-you"],
    accent: "violet",
  },
];

export const musicGenres = [
  {id: "rock", title: "Рок", accent: "rose"},
  {id: "electronic", title: "Электроника", accent: "cyan"},
  {id: "pop", title: "Поп", accent: "violet"},
  {id: "focus", title: "Для концентрации", accent: "gold"},
];

export function getTracksByIds(ids) {
  return ids.map((id) => musicTracks.find((track) => track.id === id)).filter(Boolean);
}
