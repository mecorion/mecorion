import {musicPlaylists, musicTracks} from "@/music/catalog.js";

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("ru");
// Демонстрационная статистика для локального каталога до подключения Music API.
const demoMonthlyListeners = {"Исполнитель 1": 12500, "Исполнитель 2": 8300, "Исполнитель 3": 4700};

export const searchArtists = [...new Map(musicTracks.map((track) => [track.artist, {
  id: `artist-${track.artist}`,
  type: "artist",
  title: track.artist,
  subtitle: "Исполнитель",
  cover: track.cover,
  monthlyListeners: demoMonthlyListeners[track.artist] ?? 0,
  tracks: musicTracks.filter((item) => item.artist === track.artist),
}])).values()];

export const searchAlbums = [...new Map(musicTracks.map((track) => [track.album, {
  id: `album-${track.album}`,
  type: "album",
  title: track.album,
  subtitle: track.artist,
  cover: track.cover,
  year: track.year,
  tracks: musicTracks.filter((item) => item.album === track.album),
}])).values()];

export const searchPlaylists = musicPlaylists.map((playlist) => ({
  ...playlist,
  type: "playlist",
  subtitle: "Плейлист",
}));

export function searchMusic(query) {
  const needle = normalize(query);
  if (!needle) return {tracks: [], artists: [], albums: [], playlists: [], podcasts: [], all: []};

  const tracks = musicTracks.filter((track) => normalize([track.title, track.artist, track.album].join(" ")).includes(needle));
  const artists = searchArtists.filter((artist) => normalize(artist.title).includes(needle));
  const albums = searchAlbums.filter((album) => normalize([album.title, album.subtitle].join(" ")).includes(needle));
  const playlists = searchPlaylists.filter((playlist) => normalize([playlist.title, playlist.description].join(" ")).includes(needle));
  const all = [
    ...artists,
    ...tracks.map((track) => ({...track, type: "track", subtitle: `Трек · ${track.artist}`})),
    ...albums,
    ...playlists,
  ];
  return {tracks, artists, albums, playlists, podcasts: [], all};
}

export function searchSuggestions(query, limit = 5) {
  return searchMusic(query).all.slice(0, limit).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    cover: item.cover,
  }));
}
