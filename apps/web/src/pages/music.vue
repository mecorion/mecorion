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

const featuredPlaylist = musicPlaylists[0];
const featuredTracks = getTracksByIds(featuredPlaylist.trackIds);

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
const recentTracks = computed(() => {
  const history = getTracksByIds(player.recentlyPlayedIds);
  return history.length ? history : musicTracks;
});

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
          <section class="memusic-welcome">
            <div><p class="memusic-kicker">Добрый вечер</p><h1>Что включим?</h1></div>
            <span>{{ musicTracks.length }} трека в медиатеке</span>
          </section>

          <section class="memusic-quick-grid" aria-label="Быстрый выбор">
            <UiButton unstyled
              v-for="track in musicTracks"
              :key="track.id"
              type="button"
              :disabled="!track.available"
              @click="player.playTrack(track.id, musicTracks.map((item) => item.id))"
            >
              <MusicArtwork :track="track" />
              <span><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
              <i aria-hidden="true"><SvgIcon name="play" /></i>
            </UiButton>
          </section>

          <UiCard raw unstyled class="memusic-featured">
            <img :src="featuredPlaylist.cover" :alt="`Обложка ${featuredPlaylist.title}`" />
            <div class="memusic-featured__copy">
              <p class="memusic-kicker">Персональная подборка</p>
              <h2>{{ featuredPlaylist.title }}</h2>
              <p>{{ featuredPlaylist.description }}. Обновляется по мере прослушивания.</p>
              <div>
                <UiButton unstyled class="memusic-primary-action" @click="player.playCollection(featuredPlaylist.trackIds)"><SvgIcon name="play" /> Слушать</UiButton>
                <UiButton unstyled class="memusic-icon-action" aria-label="Добавить подборку в библиотеку"><SvgIcon name="plus" /></UiButton>
              </div>
            </div>
            <div class="memusic-featured__list">
              <UiButton v-for="(track, index) in featuredTracks" :key="track.id" unstyled @click="player.playTrack(track.id, featuredPlaylist.trackIds)">
                <span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ track.title }}</strong><small>{{ track.durationLabel }}</small>
              </UiButton>
            </div>
          </UiCard>

          <section class="memusic-carousel-section">
            <div class="memusic-section-heading"><h2>Собрано для вас</h2><UiButton unstyled @click="activeSection = 'library'">Смотреть всё</UiButton></div>
            <div class="memusic-media-grid">
              <MusicMediaCard v-for="playlist in musicPlaylists" :key="playlist.id" :playlist="playlist" />
            </div>
          </section>

          <MusicTrackList :tracks="recentTracks" title="Недавно слушали" />
        </template>

        <template v-else-if="activeSection === 'search'">
          <section class="memusic-page-heading">
            <p class="memusic-kicker">Поиск</p>
            <h1>{{ query ? `Результаты для «${query}»` : 'Исследуйте музыку' }}</h1>
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
