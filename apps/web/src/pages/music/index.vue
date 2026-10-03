<script setup>
definePageMeta({workspace: true, requiresAuth: true});

import {computed, onMounted, ref, watch} from "vue";
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
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {getTracksByIds, musicGenres, musicPlaylists, musicTracks} from "@/music/catalog.js";
import {filterAndSortTracks} from "@/music/trackFilters.js";
import {searchSuggestions} from "@/music/searchCatalog.js";
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
const query = searchQuery;
const onlineFilters = ref({sort: "title"});
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

const filteredTracks = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase("ru");
  const matchesQuery = !normalized ? onlineTracks.value : onlineTracks.value.filter((track) =>
    [track.title, track.artist, track.album]
      .join(" ")
      .toLocaleLowerCase("ru")
      .includes(normalized),
  );

  return filterAndSortTracks(matchesQuery, onlineFilters.value);
});

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
const shelfPageSize = 6;
const playlistCatalog = ref([...musicPlaylists]);
const albumPage = ref(0);
const playlistPage = ref(0);
const albumPageCount = computed(() => Math.max(1, Math.ceil(catalogAlbums.value.length / shelfPageSize)));
const playlistPageCount = computed(() => Math.max(1, Math.ceil(playlistCatalog.value.length / shelfPageSize)));
const currentAlbumPage = computed(() => Math.min(albumPage.value, albumPageCount.value - 1));
const currentPlaylistPage = computed(() => Math.min(playlistPage.value, playlistPageCount.value - 1));
const visibleAlbums = computed(() => catalogAlbums.value.slice(currentAlbumPage.value * shelfPageSize, (currentAlbumPage.value + 1) * shelfPageSize));
const visiblePlaylists = computed(() => playlistCatalog.value.slice(currentPlaylistPage.value * shelfPageSize, (currentPlaylistPage.value + 1) * shelfPageSize));

watch(albumPageCount, (count) => {
  albumPage.value = Math.min(albumPage.value, count - 1);
});
watch(playlistPageCount, (count) => {
  playlistPage.value = Math.min(playlistPage.value, count - 1);
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
    {label: "Плейлисты", items: musicPlaylists.map((playlist) => ({
      id: `playlist-${playlist.id}`,
      title: playlist.title,
      icon: "music",
      active: selectedPlaylistId.value === playlist.id,
      action: () => openPlaylist(playlist.id),
    }))},
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
            <div class="memusic-collection-section-title"><div><p class="memusic-kicker">Знакомьтесь ближе</p><h2 id="artists-title">Исполнители</h2></div><span>{{ catalogArtists.length }} в каталоге</span></div>
            <div class="memusic-artist-grid">
              <UiCard v-for="artist in catalogArtists" :key="artist.name" raw unstyled class="memusic-artist-card">
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
          </section>

          <section class="memusic-library-section" aria-labelledby="albums-title">
            <div class="memusic-collection-section-title">
              <div><p class="memusic-kicker">Откройте звучание</p><h2 id="albums-title">Альбомы и релизы</h2></div>
              <div class="memusic-shelf-meta">
                <span>{{ catalogAlbums.length }} в каталоге</span>
                <div v-if="catalogAlbums.length > shelfPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать альбомы">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentAlbumPage === 0" aria-label="Предыдущие альбомы" aria-controls="music-home-albums" @click="albumPage = currentAlbumPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentAlbumPage + 1 }} / {{ albumPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentAlbumPage >= albumPageCount - 1" aria-label="Следующие альбомы" aria-controls="music-home-albums" @click="albumPage = currentAlbumPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-home-albums" class="memusic-album-strip" aria-live="polite">
              <UiCard
                v-for="track in visibleAlbums"
                :key="albumFavoriteId(track)"
                raw unstyled
                class="memusic-album-card"
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
          </section>

          <section class="memusic-library-section memusic-playlist-section" aria-labelledby="playlists-title">
            <div class="memusic-collection-section-title">
              <div><p class="memusic-kicker">Для любого настроения</p><h2 id="playlists-title">Подборки</h2></div>
              <div class="memusic-shelf-meta">
                <span>{{ playlistCatalog.length }} в каталоге</span>
                <div v-if="playlistCatalog.length > shelfPageSize" class="memusic-shelf-controls" role="group" aria-label="Листать плейлисты">
                  <UiButton unstyled class="memusic-shelf-controls__arrow memusic-shelf-controls__arrow--previous" :disabled="currentPlaylistPage === 0" aria-label="Предыдущие плейлисты" aria-controls="music-home-playlists" @click="playlistPage = currentPlaylistPage - 1"><SvgIcon name="chevron-right" /></UiButton>
                  <span class="memusic-shelf-controls__position">{{ currentPlaylistPage + 1 }} / {{ playlistPageCount }}</span>
                  <UiButton unstyled class="memusic-shelf-controls__arrow" :disabled="currentPlaylistPage >= playlistPageCount - 1" aria-label="Следующие плейлисты" aria-controls="music-home-playlists" @click="playlistPage = currentPlaylistPage + 1"><SvgIcon name="chevron-right" /></UiButton>
                </div>
              </div>
            </div>
            <div id="music-home-playlists" class="memusic-playlist-strip" aria-live="polite">
              <MusicMediaCard v-for="playlist in visiblePlaylists" :key="playlist.id" :playlist="playlist" @open="openPlaylist" />
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'search'">
          <section class="memusic-page-heading">
            <p class="memusic-kicker">Поиск</p>
            <h1>{{ query ? `Результаты для «${query}»` : 'Исследуйте музыку' }}</h1>
            <p>{{ query ? `Найдено треков: ${filteredTracks.length}` : 'Используйте поиск или фильтры, чтобы найти музыку для любого момента.' }}</p>
          </section>

          <p v-if="catalogError" role="alert">{{ catalogError }}</p>
          <MusicFilters v-model="onlineFilters" :tracks="onlineTracks" context="online" />

          <MusicTrackList
            :tracks="filteredTracks"
            :title="query ? 'Треки' : 'Вся онлайн-музыка'"
            empty-text="По этому запросу ничего не найдено"
          />

          <template v-if="!query">
            <section class="memusic-genre-section">
              <div class="memusic-section-heading"><h2>Настроения и жанры</h2></div>
              <div class="memusic-genre-grid">
                <UiButton v-for="genre in musicGenres" :key="genre.id" unstyled :class="`is-${genre.accent}`">
                  <strong>{{ genre.title }}</strong><span aria-hidden="true"><SvgIcon name="music" /></span>
                </UiButton>
              </div>
            </section>
          </template>
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
            <div class="memusic-section-heading"><h2>Ваши плейлисты</h2></div>
            <div class="memusic-media-grid">
              <MusicMediaCard v-for="playlist in musicPlaylists" :key="playlist.id" :playlist="playlist" @open="openPlaylist" />
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
