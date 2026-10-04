import {onMounted, watch} from "vue";
import {useState} from "#app";
import {readAuthSession} from "@/auth/session.js";
import {toast} from "@/components/ui";

export function useVideoWatchLater() {
  const account = readAuthSession()?.user?.id ?? "local";
  const key = `mecorion.video.watch-later.${account}`;
  const overrides = useState(key, () => ({}));
  onMounted(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        overrides.value = {...Object.fromEntries(Object.entries(stored).filter(([, value]) => typeof value === "boolean")), ...overrides.value};
      }
    } catch { /* Keep the current list if browser storage is unavailable. */ }
  });
  watch(overrides, value => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Session state remains available. */ }
  }, {deep: true});
  function isSaved(video) { return overrides.value[video.id] ?? video.state.saved; }
  function toggle(video) {
    const saved = !isSaved(video);
    overrides.value[video.id] = saved;
    toast.add({type: saved ? "success" : "info", title: saved ? "Видео сохранено в «Смотреть позже»" : "Видео удалено из «Смотреть позже»"});
  }
  return {isSaved, toggle};
}
