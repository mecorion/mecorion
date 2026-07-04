function durationInSeconds(track) {
  if (Number.isFinite(track.duration)) return track.duration;

  const [minutes = 0, seconds = 0] = String(track.durationLabel ?? "0:00")
    .split(":")
    .map(Number);
  return minutes * 60 + seconds;
}

function matchesDuration(track, range) {
  const duration = durationInSeconds(track);

  if (range === "short") return duration > 0 && duration < 180;
  if (range === "medium") return duration >= 180 && duration <= 300;
  if (range === "long") return duration > 300;
  return true;
}

function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "ru", {sensitivity: "base"});
}

export function trackFormat(track) {
  const filename = track.filename ?? "";
  return filename.includes(".") ? filename.split(".").pop().toUpperCase() : "Аудио";
}

export function trackFolder(track) {
  const parts = String(track.relativePath ?? "").split("/").filter(Boolean);
  return parts.length > 1 ? parts.at(-2) : track.album;
}

export function filterAndSortTracks(tracks, filters) {
  const filtered = tracks.filter((track) => {
    if (filters.artist && track.artist !== filters.artist) return false;
    if (filters.album && track.album !== filters.album) return false;
    if (filters.year && String(track.year) !== filters.year) return false;
    if (filters.folder && trackFolder(track) !== filters.folder) return false;
    if (filters.format && trackFormat(track) !== filters.format) return false;
    if (filters.source === "online" && track.isLocal) return false;
    if (filters.source === "local" && !track.isLocal) return false;
    if (filters.availability === "available" && !track.available) return false;
    if (filters.availability === "unavailable" && track.available) return false;
    return matchesDuration(track, filters.duration);
  });

  // sort() изменяет исходный массив. Копия защищает состояние Pinia и каталог
  // от случайной перестановки при переключении фильтра в интерфейсе.
  return [...filtered].sort((left, right) => {
    if (filters.sort === "artist") return compareText(left.artist, right.artist) || compareText(left.title, right.title);
    if (filters.sort === "album") return compareText(left.album, right.album) || compareText(left.title, right.title);
    if (filters.sort === "year-new") return (right.year ?? 0) - (left.year ?? 0);
    if (filters.sort === "year-old") return (left.year ?? 0) - (right.year ?? 0);
    if (filters.sort === "duration-short") return durationInSeconds(left) - durationInSeconds(right);
    if (filters.sort === "duration-long") return durationInSeconds(right) - durationInSeconds(left);
    if (filters.sort === "recent-local") return (right.lastModified ?? 0) - (left.lastModified ?? 0);
    return compareText(left.title, right.title);
  });
}

