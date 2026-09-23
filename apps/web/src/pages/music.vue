<script setup>
definePageMeta({workspace: true, requiresAuth: true});
import {computed, ref, watch} from "vue";
import MusicFilters from "@/components/music/MusicFilters.vue";
import MusicMediaCard from "@/components/music/MusicMediaCard.vue";
import MusicPlayerBar from "@/components/music/MusicPlayerBar.vue";
import MusicPlayerMode from "@/components/music/MusicPlayerMode.vue";
import MusicQueuePanel from "@/components/music/MusicQueuePanel.vue";
import MusicTrackList from "@/components/music/MusicTrackList.vue";
import MusicArtwork from "@/components/music/MusicArtwork.vue";
import LocalMusicView from "@/components/music/LocalMusicView.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {getTracksByIds, musicGenres, musicPlaylists, musicTracks} from "@/music/catalog.js";
import {filterAndSortTracks} from "@/music/trackFilters.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {useContextNavigation} from "@/navigation/contextNavigation.js";

const player = useMusicPlayerStore();
const activeSection = ref("home");
const query = ref("");
const selectedPlaylistId = ref(null);
const onlineFilters = ref({sort: "title"});
const libraryFilters = ref({sort: "title"});

const filteredTracks = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase("ru");
  const matchesQuery = !normalized ? musicTracks : musicTracks.filter((track) =>
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
const catalogTrackIds = musicTracks.map((track) => track.id);
const catalogArtists = computed(() => [...new Map(musicTracks.map((track) => [track.artist, {
  name: track.artist,
  cover: track.cover,
  trackId: track.id,
  available: track.available,
}])).values()]);
const catalogAlbums = computed(() => [...new Map(musicTracks.map((track) => [track.album, track])).values()]);

function navigate(section) {
  activeSection.value = section;
  selectedPlaylistId.value = null;
  if (section !== "search") query.value = "";
}

function openPlaylist(playlistId) {
  selectedPlaylistId.value = playlistId;
  activeSection.value = "library";
}

useContextNavigation({
  title: "Mecorion",
  subtitle: "Music",
  accent: "#ff6f8f",
  accentStrong: "#ff86a3",
  activeId: activeSection,
  groups: computed(() => [
    {label: null, navLabel: "Разделы Music", items: [
      {id: "home", title: "Главная", icon: "home", action: () => navigate("home")},
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
</script>

<template>
  <div class="memusic-app" :class="{'memusic-app--queue-open': player.isQueueOpen}">
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
                v-for="track in musicTracks"
                :key="track.id"
                class="memusic-collection-track"
              >
                <UiButton unstyled class="memusic-collection-track__main" :disabled="!track.available" :title="track.available ? `Слушать ${track.title}` : 'Аудио пока недоступно'" @click="player.playTrack(track.id, catalogTrackIds)">
                  <MusicArtwork :track="track" />
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
                <div class="memusic-artist-card__art"><img :src="artist.cover" :alt="`Обложка трека исполнителя ${artist.name}`" /></div>
                <strong>{{ artist.name }}</strong>
                <small>Исполнитель</small>
              </UiCard>
            </div>
          </section>

          <section class="memusic-library-section" aria-labelledby="albums-title">
            <div class="memusic-collection-section-title">
              <div><p class="memusic-kicker">Откройте звучание</p><h2 id="albums-title">Альбомы и релизы</h2></div>
              <span>{{ catalogAlbums.length }} в каталоге</span>
            </div>
            <div class="memusic-album-strip">
              <UiButton
                v-for="track in catalogAlbums"
                :key="track.album"
                unstyled
                class="memusic-album-card"
                :disabled="!track.available"
                :title="track.available ? `Слушать ${track.album}` : 'Аудио пока недоступно'"
                @click="player.playTrack(track.id, catalogTrackIds)"
              >
                <span class="memusic-album-card__cover"><img :src="track.cover" :alt="`Обложка альбома ${track.album}`" /><span aria-hidden="true"><SvgIcon name="play" /></span></span>
                <strong>{{ track.album }}</strong>
                <small>{{ track.artist }}</small>
              </UiButton>
            </div>
          </section>

          <section class="memusic-library-section memusic-playlist-section" aria-labelledby="playlists-title">
            <div class="memusic-collection-section-title"><div><p class="memusic-kicker">Для любого настроения</p><h2 id="playlists-title">Подборки</h2></div><span>{{ musicPlaylists.length }} плейлиста</span></div>
            <div class="memusic-playlist-strip">
              <UiCard v-for="playlist in musicPlaylists" :key="playlist.id" raw unstyled class="memusic-playlist-tile">
                <img :src="playlist.cover" :alt="`Обложка ${playlist.title}`" />
                <div><strong>{{ playlist.title }}</strong><small>{{ playlist.description }}</small></div>
                <UiButton unstyled :aria-label="`Открыть плейлист ${playlist.title}`" @click="openPlaylist(playlist.id)"><SvgIcon name="chevron-right" /></UiButton>
              </UiCard>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'search'">
          <section class="memusic-page-heading">
            <p class="memusic-kicker">Поиск</p>
            <h1>{{ query ? `Результаты для «${query}»` : 'Исследуйте музыку' }}</h1>
            <p>{{ query ? `Найдено треков: ${filteredTracks.length}` : 'Используйте поиск или фильтры, чтобы найти музыку для любого момента.' }}</p>
          </section>

          <MusicFilters v-model="onlineFilters" :tracks="musicTracks" context="online" />

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
              <MusicMediaCard v-for="playlist in musicPlaylists" :key="playlist.id" :playlist="playlist" />
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
