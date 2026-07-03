import {defineStore} from "pinia";
import {musicTracks} from "@/music/catalog.js";

const STORAGE_KEY = "mecorion.music.preferences";

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export const useMusicPlayerStore = defineStore("musicPlayer", {
  state: () => ({
    tracks: musicTracks,
    queueIds: musicTracks.filter((track) => track.available).map((track) => track.id),
    currentTrackId: musicTracks.find((track) => track.available)?.id ?? musicTracks[0]?.id ?? null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.72,
    isMuted: false,
    isShuffle: false,
    repeatMode: "off",
    likedTrackIds: [],
    recentlyPlayedIds: [],
    localTrackIds: [],
    localFolderName: "",
    isQueueOpen: false,
    isInitialized: false,
  }),

  getters: {
    currentTrack: (state) => state.tracks.find((track) => track.id === state.currentTrackId) ?? null,
    queueTracks: (state) => state.queueIds
      .map((id) => state.tracks.find((track) => track.id === id))
      .filter(Boolean),
    likedTracks: (state) => state.likedTrackIds
      .map((id) => state.tracks.find((track) => track.id === id))
      .filter(Boolean),
    localTracks: (state) => state.localTrackIds
      .map((id) => state.tracks.find((track) => track.id === id))
      .filter(Boolean),
  },

  actions: {
    initialize() {
      if (this.isInitialized) return;

      const saved = readPreferences();
      this.volume = typeof saved.volume === "number" ? saved.volume : this.volume;
      this.isMuted = Boolean(saved.isMuted);
      this.likedTrackIds = Array.isArray(saved.likedTrackIds) ? saved.likedTrackIds : [];
      this.repeatMode = ["off", "all", "one"].includes(saved.repeatMode) ? saved.repeatMode : "off";
      this.isShuffle = Boolean(saved.isShuffle);
      this.isInitialized = true;
    },

    persistPreferences() {
      // В localStorage сохраняются только пользовательские настройки. Текущее
      // время трека не сохраняем, чтобы прототип всегда стартовал предсказуемо.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volume: this.volume,
        isMuted: this.isMuted,
        likedTrackIds: this.likedTrackIds,
        repeatMode: this.repeatMode,
        isShuffle: this.isShuffle,
      }));
    },

    playTrack(trackId, contextIds = null) {
      const track = this.tracks.find((item) => item.id === trackId);
      if (!track?.available) return;

      if (Array.isArray(contextIds) && contextIds.length) {
        this.queueIds = contextIds.filter((id) => this.tracks.some((item) => item.id === id && item.available));
      }

      this.currentTrackId = trackId;
      this.currentTime = 0;
      this.duration = 0;
      this.isPlaying = true;
      this.addToHistory(trackId);
    },

    playCollection(trackIds) {
      const firstAvailable = trackIds.find((id) => this.tracks.find((track) => track.id === id)?.available);
      if (firstAvailable) this.playTrack(firstAvailable, trackIds);
    },

    togglePlayback() {
      if (!this.currentTrack?.available) return;
      this.isPlaying = !this.isPlaying;
    },

    nextTrack({automatic = false} = {}) {
      if (!this.queueIds.length) return;

      // Repeat-one применяется только после естественного окончания трека.
      // Кнопка Next по-прежнему должна переключать композицию.
      if (automatic && this.repeatMode === "one") {
        this.currentTime = 0;
        this.isPlaying = true;
        return;
      }

      const currentIndex = this.queueIds.indexOf(this.currentTrackId);
      let nextIndex = currentIndex + 1;

      if (this.isShuffle && this.queueIds.length > 1) {
        const candidates = this.queueIds.filter((id) => id !== this.currentTrackId);
        const randomId = candidates[Math.floor(Math.random() * candidates.length)];
        nextIndex = this.queueIds.indexOf(randomId);
      } else if (nextIndex >= this.queueIds.length) {
        if (this.repeatMode === "all" || !automatic) nextIndex = 0;
        else {
          this.isPlaying = false;
          return;
        }
      }

      this.playTrack(this.queueIds[nextIndex]);
    },

    previousTrack() {
      if (!this.queueIds.length) return;
      const currentIndex = this.queueIds.indexOf(this.currentTrackId);
      const previousIndex = currentIndex <= 0 ? this.queueIds.length - 1 : currentIndex - 1;
      this.playTrack(this.queueIds[previousIndex]);
    },

    toggleLike(trackId) {
      this.likedTrackIds = this.likedTrackIds.includes(trackId)
        ? this.likedTrackIds.filter((id) => id !== trackId)
        : [...this.likedTrackIds, trackId];
      this.persistPreferences();
    },

    toggleShuffle() {
      this.isShuffle = !this.isShuffle;
      this.persistPreferences();
    },

    cycleRepeatMode() {
      const modes = ["off", "all", "one"];
      this.repeatMode = modes[(modes.indexOf(this.repeatMode) + 1) % modes.length];
      this.persistPreferences();
    },

    setVolume(value) {
      this.volume = Math.min(1, Math.max(0, Number(value)));
      if (this.volume > 0) this.isMuted = false;
      this.persistPreferences();
    },

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.persistPreferences();
    },

    addToHistory(trackId) {
      this.recentlyPlayedIds = [trackId, ...this.recentlyPlayedIds.filter((id) => id !== trackId)].slice(0, 12);
    },

    replaceLocalLibrary(localTracks, folderName) {
      const previousLocalTracks = this.tracks.filter((track) => track.isLocal);
      const wasPlayingLocalTrack = previousLocalTracks.some((track) => track.id === this.currentTrackId);

      if (wasPlayingLocalTrack) {
        this.isPlaying = false;
        this.currentTrackId = musicTracks.find((track) => track.available)?.id ?? null;
        this.currentTime = 0;
        this.duration = 0;
      }

      previousLocalTracks.forEach((track) => {
        if (track.source?.startsWith("blob:")) URL.revokeObjectURL(track.source);
      });

      this.tracks = [...musicTracks, ...localTracks];
      this.localTrackIds = localTracks.map((track) => track.id);
      this.localFolderName = folderName;
      this.queueIds = this.queueIds.filter((id) => !previousLocalTracks.some((track) => track.id === id));

      if (!this.currentTrackId && localTracks.length) {
        this.currentTrackId = localTracks[0].id;
      }
    },

    clearLocalLibrary() {
      this.replaceLocalLibrary([], "");
    },
  },
});
