<script setup>
definePageMeta({workspace: true, requiresAuth: true});

import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute, useRouter} from "#app";
import MusicFilters from "@/components/music/MusicFilters.vue";
import MusicMediaCard from "@/components/music/MusicMediaCard.vue";
import MusicPlayerBar from "@/components/music/MusicPlayerBar.vue";
import MusicPlayerMode from "@/components/music/MusicPlayerMode.vue";
import MusicQueuePanel from "@/components/music/MusicQueuePanel.vue";
import MusicTrackList from "@/components/music/MusicTrackList.vue";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import LocalMusicView from "@/components/music/LocalMusicView.vue";
import MusicOnboarding from "@/components/music/MusicOnboarding.vue";
import MusicSearchView from "@/components/music/MusicSearchView.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {getTracksByIds, musicPlaylists, musicTracks} from "@/music/catalog.js";
import {filterAndSortTracks} from "@/music/trackFilters.js";
import {searchMusic, searchSuggestions} from "@/music/searchCatalog.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {useContextNavigation} from "@/navigation/contextNavigation.js";

const player = useMusicPlayerStore();
const route = useRoute();
const router = useRouter();
const showOnboarding = ref(false);
onMounted(() => { showOnboarding.value = !localStorage.getItem("mecorion.music.onboarding"); });
const activeSection = ref(route.query.section === "search" ? "search" : "home");
const searchInput = ref(String(route.query.q ?? ""));
const searchQuery = ref(String(route.query.q ?? ""));
const searchTab = ref("all");
const searchResults = computed(() => searchMusic(searchQuery.value));
const searchConfig = {
  query: searchInput,
  suggestions: computed(() => searchSuggestions(searchInput.value)),
  placeholder: "Поиск по Mecorion Music",
  onInput: (value) => { searchInput.value = value; },
  onSubmit: (value) => { searchQuery.value = value.trim(); navigate("search"); },
  onSelect: (item) => { searchInput.value = item.title; searchQuery.value = item.title; navigate("search"); },
  onClear: () => { searchInput.value = ""; searchQuery.value = ""; },
  onActivate: () => navigate("search"),
};
const selectedPlaylistId = ref(null);
const catalogError = ref("");
const libraryFilters = ref({sort: "title"});
const onlineTracks = computed(() => player.tracks.filter((track) => !track.isLocal));

const selectedPlaylist = computed(() => musicPlaylists.find((playlist) => playlist.id === selectedPlaylistId.value) ?? null);
const selectedPlaylistTracks = computed(() => selectedPlaylist.value ? getTracksByIds(selectedPlaylist.value.trackIds) : []);
const librarySourceTracks = computed(() => selectedPlaylist.value ? selectedPlaylistTracks.value : player.likedTracks);
const filteredLibraryTracks = computed(() => filterAndSortTracks(librarySourceTracks.value, libraryFilters.value));
const catalogTrackIds = computed(() => onlineTracks.value.map((track) => track.id));
const catalogArtists = computed(() => [...new Map(onlineTracks.value.map((track) => [track.artist, {
  name: track.artist,
  cover: track.cover,
  trackId: track.id,
  available: track.available,
}])).values()]);
const catalogAlbums = computed(() => [...new Map(onlineTracks.value.map((track) => [`${track.artist}:${track.album}`, track])).values()]);
const albumStrip = ref(null);
const artistStrip = ref(null);
const playlistStrip = ref(null);
const libraryPlaylistStrip = ref(null);
const albumPageSize = ref(6);
const artistPageSize = ref(6);
const playlistPageSize = ref(6);
const libraryPlaylistPageSize = ref(6);
const albumStripWidth = ref(0);
const artistStripWidth = ref(0);
const playlistStripWidth = ref(0);
const libraryPlaylistStripWidth = ref(0);
let shelfResizeObserver;
const columnsForWidth = (width) => Math.min(6, Math.max(1, Math.floor((width + 20) / 200)));
onMounted(() => {
  shelfResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      if (entry.target === albumStrip.value) { albumStripWidth.value = width; albumPageSize.value = columnsForWidth(width); }
      if (entry.target === artistStrip.value) { artistStripWidth.value = width; artistPageSize.value = columnsForWidth(width); }
      if (entry.target === playlistStrip.value) { playlistStripWidth.value = width; playlistPageSize.value = columnsForWidth(width); }
      if (entry.target === libraryPlaylistStrip.value) { libraryPlaylistStripWidth.value = width; libraryPlaylistPageSize.value = columnsForWidth(width); }
    }
  });
  if (albumStrip.value) shelfResizeObserver.observe(albumStrip.value);
  if (artistStrip.value) shelfResizeObserver.observe(artistStrip.value);
  if (playlistStrip.value) shelfResizeObserver.observe(playlistStrip.value);
  if (libraryPlaylistStrip.value) shelfResizeObserver.observe(libraryPlaylistStrip.value);
});
onUnmounted(() => { shelfResizeObserver?.disconnect(); clearTimeout(swipeClickTimer); });
watch([albumStrip, artistStrip, playlistStrip, libraryPlaylistStrip], ([album, artist, playlist, libraryPlaylist], [previousAlbum, previousArtist, previousPlaylist, previousLibraryPlaylist]) => {
  if (!shelfResizeObserver) return;
  if (previousAlbum) shelfResizeObserver.unobserve(previousAlbum);
  if (previousArtist) shelfResizeObserver.unobserve(previousArtist);
  if (previousPlaylist) shelfResizeObserver.unobserve(previousPlaylist);
  if (previousLibraryPlaylist) shelfResizeObserver.unobserve(previousLibraryPlaylist);
  if (album) shelfResizeObserver.observe(album);
  if (artist) shelfResizeObserver.observe(artist);
  if (playlist) shelfResizeObserver.observe(playlist);
  if (libraryPlaylist) shelfResizeObserver.observe(libraryPlaylist);
});
const playlistCatalog = ref([...musicPlaylists]);
const albumPage = ref(0);
const artistPage = ref(0);
const playlistPage = ref(0);
const libraryPlaylistPage = ref(0);
const albumPageCount = computed(() => Math.max(1, catalogAlbums.value.length - albumPageSize.value + 1));
const artistPageCount = computed(() => Math.max(1, catalogArtists.value.length - artistPageSize.value + 1));
const playlistPageCount = computed(() => Math.max(1, playlistCatalog.value.length - playlistPageSize.value + 1));
const libraryPlaylistPageCount = computed(() => Math.max(1, playlistCatalog.value.length - libraryPlaylistPageSize.value + 1));
const currentAlbumPage = computed(() => Math.min(albumPage.value, albumPageCount.value - 1));
const currentArtistPage = computed(() => Math.min(artistPage.value, artistPageCount.value - 1));
const currentPlaylistPage = computed(() => Math.min(playlistPage.value, playlistPageCount.value - 1));
const currentLibraryPlaylistPage = computed(() => Math.min(libraryPlaylistPage.value, libraryPlaylistPageCount.value - 1));

function shelfStyle(width, pageSize, total, page) {
  const columns = Math.max(1, Math.min(pageSize, total));
  const cardWidth = width ? (width - (columns - 1) * 20) / columns : 0;
  return {
    '--shelf-card-width': width ? `${cardWidth}px` : `calc((100% - ${(columns - 1) * 20}px) / ${columns})`,
    '--shelf-offset': `${-page * (cardWidth + 20)}px`,
    gridTemplateColumns: 'none',
  };
}

const shelfPages = {artists: artistPage, albums: albumPage, playlists: playlistPage, libraryPlaylists: libraryPlaylistPage};
const shelfPageCounts = {artists: artistPageCount, albums: albumPageCount, playlists: playlistPageCount, libraryPlaylists: libraryPlaylistPageCount};
let swipeStart = null;
let suppressSwipeClick = false;
let swipeClickTimer;

function startShelfSwipe(shelf, event) {
  if (event.touches.length !== 1) return;
  swipeStart = {shelf, x: event.touches[0].clientX, y: event.touches[0].clientY};
}

function endShelfSwipe(shelf, event) {
  if (!swipeStart || swipeStart.shelf !== shelf || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  const page = shelfPages[shelf];
  page.value = Math.max(0, Math.min(shelfPageCounts[shelf].value - 1, page.value + (dx < 0 ? 1 : -1)));
  suppressSwipeClick = true;
  clearTimeout(swipeClickTimer);
  swipeClickTimer = setTimeout(() => { suppressSwipeClick = false; }, 450);
}

function preventSwipeClick(event) {
  if (!suppressSwipeClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressSwipeClick = false;
}

watch(albumPageCount, (count) => {
  albumPage.value = Math.min(albumPage.value, count - 1);
});
watch(artistPageCount, (count) => {
  artistPage.value = Math.min(artistPage.value, count - 1);
});
watch(playlistPageCount, (count) => {
  playlistPage.value = Math.min(playlistPage.value, count - 1);
});
watch(libraryPlaylistPageCount, (count) => {
  libraryPlaylistPage.value = Math.min(libraryPlaylistPage.value, count - 1);
});

// Серверный каталог временно отключён: Music работает с локальным musicTracks.
/*
async function loadCatalog() {
  try {
    const response = await fetch("/api/v1/music/tracks?limit=100", {credentials: "include"});
    if (!response.ok) throw new Error("Каталог музыки недоступен");
    const {items} = await response.json();
    const uploadedTracks = items.map((item) => {
      const duration = item.durationMs ? Math.round(item.durationMs / 1000) : 0;
      return {
        id: item.id,
        title: item.title,
        artist: item.artists?.join(", ") || "Неизвестный исполнитель",
        album: item.album || "Синглы",
        year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
        durationLabel: duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : "—",
        cover: null,
        accent: "rose",
        source: `/api/v1/music/tracks/${item.id}/audio`,
        available: true,
      };
    });
    player.setOnlineCatalog([...uploadedTracks, ...musicTracks]);
    catalogError.value = "";
  } catch {
    catalogError.value = "Не удалось загрузить музыку с сервера";
  }
}

onMounted(() => {
  void loadCatalog();
  window.addEventListener("focus", loadCatalog);
});
onBeforeUnmount(() => window.removeEventListener("focus", loadCatalog));
*/

function navigate(section) {
  activeSection.value = section;
  selectedPlaylistId.value = null;
  if (section !== "search" && route.query.section === "search") {
    router.replace({query: {...route.query, section: undefined}});
  }
}

function openPlaylist(playlistId) {
  selectedPlaylistId.value = playlistId;
  activeSection.value = "library";
}

function runSearch(value) {
  searchInput.value = value;
  searchQuery.value = value.trim();
  searchTab.value = "all";
  navigate("search");
}

function selectSearchResult(item) {
  if (item.type === "playlist") {
    openPlaylist(item.id);
    return;
  }
  searchInput.value = item.title;
  searchQuery.value = item.title;
  searchTab.value = {track: "tracks", artist: "artists", album: "albums"}[item.type] ?? "all";
}

function albumFavoriteId(track) {
  return `${track.artist}:${track.album}`;
}

function albumTrackIds(track) {
  return onlineTracks.value.filter((item) => item.artist === track.artist && item.album === track.album).map((item) => item.id);
}

function canPlayAlbum(track) {
  return onlineTracks.value.some((item) => item.artist === track.artist && item.album === track.album && item.available);
}

useContextNavigation({
  title: "Mecorion",
  subtitle: "Music",
  accent: "#ff6f8f",
  accentStrong: "#ff86a3",
  activeId: computed(() => showOnboarding.value ? "onboarding" : activeSection.value),
  search: searchConfig,
  groups: computed(() => [
    {label: null, navLabel: "Настройка Music", items: [{id: "onboarding", title: "Первый запуск", icon: "star", active: showOnboarding.value, action: () => { showOnboarding.value = true; }}]},
    {label: null, navLabel: "Разделы Music", items: [
     {id: "home", title: "Главная", icon: "home", action: () => navigate("home")},
      {id: "search", title: "Поиск", icon: "search", action: () => navigate("search")},
      {id: "library", title: "Моя музыка", icon: "music", action: () => navigate("library")},
      {id: "local", title: "Локальная музыка", icon: "download", action: () => navigate("local")},
    ]},
  ]),
});

watch(selectedPlaylistId, () => {
  libraryFilters.value = {sort: "title"};
});

watch(() => route.query.section, (section) => {
  if (section === "search") navigate("search");
});
watch(() => route.query.q, (value) => {
  searchInput.value = String(value ?? "");
  searchQuery.value = searchInput.value;
});
</script>

<template>
  <MusicOnboarding v-if="showOnboarding" @finish="showOnboarding = false" />
  <div v-else class="memusic-app" :class="{'memusic-app--queue-open': player.isQueueOpen}">
    <section class="memusic-workspace" :inert="player.isPlayerModeOpen">
      <main class="memusic-content">
        <template v-if="activeSection === 'home'">
          <section class="memusic-collection-heading">
            <div class="memusic-collection-heading__copy">
              <p class="memusic-kicker">Ваша коллекция / Mecorion Music</p>
              <h1>Музыка<br /><em>под ваш ритм.</em></h1>
              <p>Любимые треки, новые открытия и подборки — всё в одном месте.</p>
              <div class="memusic-collection-heading__actions">
                <UiButton variant="primary" @click="navigate('search')"><SvgIcon name="search" /> Исследовать музыку</UiButton>
                <UiButton variant="outline" @click="navigate('local')"><SvgIcon name="folder" /> Мои файлы</UiButton>
              </div>
            </div>
            <div class="memusic-collection-heading__art" aria-hidden="true">
              <img v-for="playlist in musicPlaylists" :key="playlist.id" :src="playlist.cover" alt="" />
              <span class="memusic-collection-heading__art-note">MUSIC / MECORION</span>
            </div>
          </section>

          <section class="memusic-library-section" aria-labelledby="liked-title">
            <div class="memusic-library-section__head">
              <UiButton unstyled class="memusic-library-title" @click="navigate('library')">
                <span class="memusic-library-title__cover"><SvgIcon name="heart" /></span>
                <span><strong id="liked-title">Мне нравится</strong><small>{{ player.likedTrackIds.length }} в избранном</small></span>
                <SvgIcon name="chevron-right" />
              </UiButton>
              <span class="memusic-library-section__eyebrow">Ваша коллекция начинается здесь</span>
            </div>

            <div class="memusic-collection-subhead"><h3>Откройте для себя</h3><span>Добавляйте треки в избранное</span></div>

            <div class="memusic-collection-tracks">
              <div
                v-for="track in onlineTracks"
                :key="track.id"
                class="memusic-collection-track"
              >
                <UiButton unstyled class="memusic-collection-track__main" :disabled="!track.available" :title="track.available ? `Слушать ${track.title}` : 'Аудио пока недоступно'" @click="player.playTrack(track.id, catalogTrackIds)">
                  <MusicArtwork :track="track" play-overlay />
                  <span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
                </UiButton>
                <UiButton
                  unstyled
                  class="memusic-collection-track__like"
                  :class="{'is-active': player.likedTrackIds.includes(track.id)}"
                  :aria-label="player.likedTrackIds.includes(track.id) ? 'Убрать из любимых' : 'Добавить в любимые'"
                  @click.stop="player.toggleLike(track.id)"
                ><SvgIcon name="heart" /></UiButton>
                <small>{{ track.durationLabel }}</small>
              </div>
            </div>
          </section>

          <section class="memusic-library-section" aria-labelledby="artists-title">
            <div class="memusic-collection-section-title">
              <div class="memusic-shelf-heading"><p class="memusic-kicker">Знакомьтесь ближе</p><h2 id="artists-title">Исполнители</h2><span class="memusic-shelf-count">{{ catalogArtists.length }} в каталоге</span></div>
              <div class="memusic-shelf-meta">
                <div v-if="catalogArtists.length > artistPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать исполнителей">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentArtistPage === 0" aria-label="Предыдущие исполнители" aria-controls="music-home-artists" @click="artistPage = currentArtistPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentArtistPage + 1 }} / {{ artistPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentArtistPage >= artistPageCount - 1" aria-label="Следующие исполнители" aria-controls="music-home-artists" @click="artistPage = currentArtistPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-home-artists" ref="artistStrip" class="memusic-shelf-viewport" aria-live="polite" @touchstart.passive="startShelfSwipe('artists', $event)" @touchend.passive="endShelfSwipe('artists', $event)" @touchcancel="swipeStart = null" @click.capture="preventSwipeClick">
              <div class="memusic-artist-grid memusic-shelf-track" :style="shelfStyle(artistStripWidth, artistPageSize, catalogArtists.length, currentArtistPage)">
              <UiCard v-for="(artist, index) in catalogArtists" :key="artist.name" raw unstyled class="memusic-artist-card" :inert="index < currentArtistPage || index >= currentArtistPage + artistPageSize" :aria-hidden="index < currentArtistPage || index >= currentArtistPage + artistPageSize">
                <div class="memusic-artist-card__art">
                  <img v-if="artist.cover" :src="artist.cover" :alt="`Обложка трека исполнителя ${artist.name}`" />
                  <div v-else class="memusic-cover-placeholder" aria-hidden="true"><SvgIcon name="music" /></div>
                  <div class="memusic-catalog-overlay">
                    <UiButton unstyled class="memusic-catalog-overlay__like" :class="{'is-active': player.likedArtistNames.includes(artist.name)}" :aria-label="player.likedArtistNames.includes(artist.name) ? `Убрать ${artist.name} из избранного` : `Добавить ${artist.name} в избранное`" :aria-pressed="player.likedArtistNames.includes(artist.name)" @click="player.toggleArtistLike(artist.name)"><SvgIcon name="heart" /></UiButton>
                  </div>
                </div>
                <strong>{{ artist.name }}</strong>
                <small>Исполнитель</small>
              </UiCard>
              </div>
            </div>
          </section>

          <section class="memusic-library-section" aria-labelledby="albums-title">
            <div class="memusic-collection-section-title">
              <div class="memusic-shelf-heading"><p class="memusic-kicker">Откройте звучание</p><h2 id="albums-title">Альбомы и релизы</h2><span class="memusic-shelf-count">{{ catalogAlbums.length }} в каталоге</span></div>
              <div class="memusic-shelf-meta">
                <div v-if="catalogAlbums.length > albumPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать альбомы">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentAlbumPage === 0" aria-label="Предыдущие альбомы" aria-controls="music-home-albums" @click="albumPage = currentAlbumPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentAlbumPage + 1 }} / {{ albumPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentAlbumPage >= albumPageCount - 1" aria-label="Следующие альбомы" aria-controls="music-home-albums" @click="albumPage = currentAlbumPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-home-albums" ref="albumStrip" class="memusic-shelf-viewport" aria-live="polite" @touchstart.passive="startShelfSwipe('albums', $event)" @touchend.passive="endShelfSwipe('albums', $event)" @touchcancel="swipeStart = null" @click.capture="preventSwipeClick">
              <div class="memusic-album-strip memusic-shelf-track" :style="shelfStyle(albumStripWidth, albumPageSize, catalogAlbums.length, currentAlbumPage)">
              <UiCard
                v-for="(track, index) in catalogAlbums"
                :key="albumFavoriteId(track)"
                raw unstyled
                class="memusic-album-card"
                :inert="index < currentAlbumPage || index >= currentAlbumPage + albumPageSize"
                :aria-hidden="index < currentAlbumPage || index >= currentAlbumPage + albumPageSize"
              >
                <div class="memusic-album-card__cover">
                  <img v-if="track.cover" :src="track.cover" :alt="`Обложка альбома ${track.album}`" />
                  <div v-else class="memusic-cover-placeholder" aria-hidden="true"><SvgIcon name="music" /></div>
                  <div class="memusic-catalog-overlay">
                    <UiButton unstyled class="memusic-catalog-overlay__play" :disabled="!canPlayAlbum(track)" :aria-label="`Включить альбом ${track.album}`" :title="canPlayAlbum(track) ? `Включить ${track.album}` : 'Аудио пока недоступно'" @click="player.playCollection(albumTrackIds(track))"><SvgIcon name="play" /></UiButton>
                    <UiButton unstyled class="memusic-catalog-overlay__like" :class="{'is-active': player.likedAlbumIds.includes(albumFavoriteId(track))}" :aria-label="player.likedAlbumIds.includes(albumFavoriteId(track)) ? `Убрать ${track.album} из избранного` : `Добавить ${track.album} в избранное`" :aria-pressed="player.likedAlbumIds.includes(albumFavoriteId(track))" @click="player.toggleAlbumLike(albumFavoriteId(track))"><SvgIcon name="heart" /></UiButton>
                  </div>
                </div>
                <UiButton unstyled class="memusic-album-card__title" :aria-label="`Открыть альбом ${track.album}`" @click="$router.push('/music/album/night-signal')"><strong>{{ track.album }}</strong></UiButton>
                <small>{{ track.artist }}</small>
              </UiCard>
              </div>
            </div>
          </section>

          <section class="memusic-library-section memusic-playlist-section" aria-labelledby="playlists-title">
            <div class="memusic-collection-section-title">
              <div class="memusic-shelf-heading"><p class="memusic-kicker">Для любого настроения</p><h2 id="playlists-title">Подборки</h2><span class="memusic-shelf-count">{{ playlistCatalog.length }} в каталоге</span></div>
              <div class="memusic-shelf-meta">
                <div v-if="playlistCatalog.length > playlistPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать плейлисты">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentPlaylistPage === 0" aria-label="Предыдущие плейлисты" aria-controls="music-home-playlists" @click="playlistPage = currentPlaylistPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentPlaylistPage + 1 }} / {{ playlistPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentPlaylistPage >= playlistPageCount - 1" aria-label="Следующие плейлисты" aria-controls="music-home-playlists" @click="playlistPage = currentPlaylistPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-home-playlists" ref="playlistStrip" class="memusic-shelf-viewport" aria-live="polite" @touchstart.passive="startShelfSwipe('playlists', $event)" @touchend.passive="endShelfSwipe('playlists', $event)" @touchcancel="swipeStart = null" @click.capture="preventSwipeClick">
              <div class="memusic-playlist-strip memusic-shelf-track" :style="shelfStyle(playlistStripWidth, playlistPageSize, playlistCatalog.length, currentPlaylistPage)">
                <MusicMediaCard v-for="(playlist, index) in playlistCatalog" :key="playlist.id" :playlist="playlist" :inert="index < currentPlaylistPage || index >= currentPlaylistPage + playlistPageSize" :aria-hidden="index < currentPlaylistPage || index >= currentPlaylistPage + playlistPageSize" @open="openPlaylist" />
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'search'">
          <MusicSearchView v-model:tab="searchTab" :query="searchQuery" :results="searchResults" @search="runSearch" @select="selectSearchResult" @clear="runSearch('')" />
        </template>

        <template v-else-if="activeSection === 'local'">
          <LocalMusicView />
        </template>

        <template v-else>
          <section v-if="selectedPlaylist" class="memusic-playlist-heading">
            <img :src="selectedPlaylist.cover" :alt="`Обложка ${selectedPlaylist.title}`" />
            <div><p class="memusic-kicker">Плейлист</p><h1>{{ selectedPlaylist.title }}</h1><p>{{ selectedPlaylist.description }}</p><UiButton unstyled class="memusic-primary-action" @click="player.playCollection(selectedPlaylist.trackIds)"><SvgIcon name="play" /> Слушать</UiButton></div>
          </section>
          <section v-else class="memusic-page-heading">
            <p class="memusic-kicker">Коллекция</p><h1>Моя музыка</h1><p>Избранные треки и сохранённые подборки.</p>
          </section>

          <MusicFilters
            v-model="libraryFilters"
            :tracks="librarySourceTracks"
            :context="selectedPlaylist ? 'playlist' : 'favorites'"
          />

          <MusicTrackList
            :tracks="filteredLibraryTracks"
            :title="selectedPlaylist ? 'Треки плейлиста' : 'Любимые треки'"
            empty-text="Добавляйте треки в любимые кнопкой с сердцем"
          />

          <section v-if="!selectedPlaylist" class="memusic-carousel-section">
            <div class="memusic-collection-section-title">
              <div class="memusic-shelf-heading"><h2 id="library-playlists-title">Ваши плейлисты</h2><span class="memusic-shelf-count">{{ playlistCatalog.length }} в каталоге</span></div>
              <div class="memusic-shelf-meta">
                <div v-if="playlistCatalog.length > libraryPlaylistPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать ваши плейлисты">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentLibraryPlaylistPage === 0" aria-label="Предыдущие плейлисты" aria-controls="music-library-playlists" @click="libraryPlaylistPage = currentLibraryPlaylistPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentLibraryPlaylistPage + 1 }} / {{ libraryPlaylistPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentLibraryPlaylistPage >= libraryPlaylistPageCount - 1" aria-label="Следующие плейлисты" aria-controls="music-library-playlists" @click="libraryPlaylistPage = currentLibraryPlaylistPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-library-playlists" ref="libraryPlaylistStrip" class="memusic-shelf-viewport" aria-live="polite" @touchstart.passive="startShelfSwipe('libraryPlaylists', $event)" @touchend.passive="endShelfSwipe('libraryPlaylists', $event)" @touchcancel="swipeStart = null" @click.capture="preventSwipeClick">
              <div class="memusic-media-grid memusic-media-grid--shelf memusic-shelf-track" :style="shelfStyle(libraryPlaylistStripWidth, libraryPlaylistPageSize, playlistCatalog.length, currentLibraryPlaylistPage)">
                <MusicMediaCard v-for="(playlist, index) in playlistCatalog" :key="playlist.id" :playlist="playlist" :inert="index < currentLibraryPlaylistPage || index >= currentLibraryPlaylistPage + libraryPlaylistPageSize" :aria-hidden="index < currentLibraryPlaylistPage || index >= currentLibraryPlaylistPage + libraryPlaylistPageSize" @open="openPlaylist" />
              </div>
            </div>
          </section>
        </template>
      </main>
    </section>

    <MusicQueuePanel :inert="player.isPlayerModeOpen" />
    <MusicPlayerMode />
    <MusicPlayerBar :inert="player.isPlayerModeOpen" />
  </div>
</template>
