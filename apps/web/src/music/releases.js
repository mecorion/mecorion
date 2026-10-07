import forestCover from "@/assets/images/music/forest-night.svg?url";
import neonCover from "@/assets/images/music/neon-drive.svg?url";
import nightSignalCover from "@/assets/images/music/night-signal.svg?url";
import stadiumCover from "@/assets/images/music/stadium-light.svg?url";

const releaseTracks = [
  {id: "track-01", title: "Ночной сигнал", artist: "Norten", album: "Ночной сигнал", durationLabel: "3:11", available: true, cover: nightSignalCover},
  {id: "track-02", title: "Другой мир", artist: "Norten, Aira", album: "Ночной сигнал", durationLabel: "3:25", available: true, cover: nightSignalCover},
  {id: "track-03", title: "Между нами", artist: "Norten", album: "Ночной сигнал", durationLabel: "3:44", available: true, cover: nightSignalCover},
];

const common = {
  artist: "Norten",
  year: "2026",
  label: "Mecorion Records",
  description: "«Ночной сигнал» — истории о городе, который звучит громче после полуночи. Атмосферные синтезаторы, честные эмоции и движение между тишиной и светом.",
  credits: ["Norten — вокал, синтезаторы", "Aira — бэк-вокал", "MAXSSON — продюсер", "Solaris — мастеринг"],
  likes: "12,8 тыс.",
};

export const musicReleases = [
  {...common, id: "night-signal", kind: "album", typeLabel: "Альбом", title: "Ночной сигнал", cover: nightSignalCover, tracks: releaseTracks, date: "18 сентября 2026"},
  {...common, id: "another-world", kind: "track", typeLabel: "Трек", title: "Другой мир", cover: nightSignalCover, tracks: releaseTracks.slice(1, 2), date: "18 сентября 2026"},
  {...common, id: "horizons", kind: "single", typeLabel: "Сингл", title: "Горизонты", cover: forestCover, tracks: releaseTracks.slice(0, 1), date: "4 сентября 2026"},
  {...common, id: "afterglow", kind: "ep", typeLabel: "EP", title: "Послесвечение", cover: stadiumCover, tracks: releaseTracks.slice(0, 2), date: "21 августа 2026"},
  {...common, id: "evening-flow", kind: "playlist", typeLabel: "Плейлист", title: "Вечерний поток", cover: neonCover, tracks: releaseTracks, artist: "Mecorion Music", date: "Обновлено сегодня", description: "Музыка для момента, когда рабочий шум стихает и город переходит на мягкий вечерний ритм."},
  {...common, id: "city-voices", kind: "podcast", typeLabel: "Подкаст", title: "Голоса города", cover: forestCover, artist: "Mecorion Originals", date: "Новый выпуск по пятницам", description: "Люди, места и музыка, из которых складывается современный город.", tracks: [
    {...releaseTracks[0], id: "podcast-01", title: "Почему города никогда не молчат", artist: "Эпизод 12", durationLabel: "42:18"},
    {...releaseTracks[1], id: "podcast-02", title: "Архитектура ночного света", artist: "Эпизод 11", durationLabel: "38:04"},
  ]},
];

export function findMusicRelease(kind, id) {
  return musicReleases.find((release) => release.kind === kind && release.id === id) ?? null;
}

export function getRelatedReleases(currentId) {
  return musicReleases.filter((release) => release.id !== currentId).slice(0, 5);
}
