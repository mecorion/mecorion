import {formatPlaybackTime} from "@/utils/music.js";

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus", "webm"]);

function isAudioFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(extension);
}

function normalizeFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/_?-_?/g, " - ")
    .replace(/_/g, " ")
    .replace(/\s+\d{6,}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTrackMetadata(file, relativePath, rootName) {
  const normalized = normalizeFilename(file.name);
  const separatorIndex = normalized.indexOf(" - ");
  const pathParts = relativePath.split("/").filter(Boolean);
  const parentFolder = pathParts.length > 1 ? pathParts.at(-2) : rootName;

  return {
    title: separatorIndex >= 0 ? normalized.slice(separatorIndex + 3) : normalized,
    artist: separatorIndex >= 0 ? normalized.slice(0, separatorIndex) : "Неизвестный исполнитель",
    album: parentFolder || "Локальная музыка",
  };
}

function createLocalId(relativePath, file) {
  // Небольшой детерминированный hash делает id стабильным внутри повторного
  // выбора той же папки без передачи абсолютного пути пользователя.
  const value = `${relativePath}:${file.size}:${file.lastModified}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `local-${Math.abs(hash)}`;
}

function readDuration(source) {
  return new Promise((resolve) => {
    const probe = new Audio();
    let settled = false;
    const timeout = window.setTimeout(() => finish(0), 8000);

    function finish(duration) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      probe.removeAttribute("src");
      probe.load();
      resolve(Number.isFinite(duration) ? duration : 0);
    }

    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => finish(probe.duration), {once: true});
    probe.addEventListener("error", () => finish(0), {once: true});
    probe.src = source;
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const result = new Array(items.length);
  let cursor = 0;

  // Ограничиваем число одновременно открытых Audio-объектов: каталог на
  // несколько тысяч файлов иначе может исчерпать память вкладки.
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker));
  return result;
}

export async function scanDirectoryHandle(rootHandle, onProgress = () => {}) {
  const entries = [];

  async function visit(directoryHandle, pathParts = []) {
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === "directory") {
        await visit(handle, [...pathParts, name]);
      } else {
        const file = await handle.getFile();
        if (isAudioFile(file)) {
          entries.push({file, relativePath: [...pathParts, name].join("/")});
          onProgress(entries.length);
        }
      }
    }
  }

  await visit(rootHandle);
  return {rootName: rootHandle.name, entries};
}

export function filesFromDirectoryInput(fileList) {
  const files = Array.from(fileList).filter(isAudioFile);
  const rootName = files[0]?.webkitRelativePath?.split("/")[0] || "Локальная музыка";

  return {
    rootName,
    entries: files.map((file) => {
      const fullPath = file.webkitRelativePath || file.name;
      const parts = fullPath.split("/");
      if (parts[0] === rootName) parts.shift();
      return {file, relativePath: parts.join("/") || file.name};
    }),
  };
}

export async function createLocalTracks(entries, rootName, onProgress = () => {}) {
  return mapWithConcurrency(entries, 5, async ({file, relativePath}, index) => {
    const source = URL.createObjectURL(file);
    const duration = await readDuration(source);
    const metadata = extractTrackMetadata(file, relativePath, rootName);

    onProgress(index + 1, entries.length);
    return {
      id: createLocalId(relativePath, file),
      ...metadata,
      year: new Date(file.lastModified).getFullYear(),
      duration,
      durationLabel: duration ? formatPlaybackTime(duration) : "--:--",
      cover: null,
      accent: ["rose", "cyan", "violet", "gold"][index % 4],
      source,
      available: true,
      isLocal: true,
      relativePath,
      filename: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
    };
  });
}
