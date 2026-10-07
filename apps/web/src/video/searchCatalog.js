import {videoCatalog} from "@/video/catalog.js";

const normalize = value => String(value ?? "").trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
export function searchVideo(query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return videoCatalog.filter(video => {
    const text = normalize([video.title, video.subtitle, video.author, video.body, video.state.kind].join(" "));
    return words.every(word => text.includes(word));
  }).sort((a, b) => Number(normalize(b.title).includes(normalize(query))) - Number(normalize(a.title).includes(normalize(query))));
}
export function videoSearchSuggestions(query) {
  return searchVideo(query).slice(0, 5).map(video => ({id: video.id, type: "video", title: video.title, subtitle: `${video.state.kind} · ${video.author}`, cover: video.coverUrl}));
}
